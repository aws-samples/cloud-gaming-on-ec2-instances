/* tslint:disable:no-submodule-imports quotemark no-unused-expression */
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { InstanceSize } from 'aws-cdk-lib/aws-ec2/lib/instance-types';
import { getNvidiaConfigs } from './configs/ec2-nvidia-configs';
import { getAMDConfigs } from './configs/ec2-amd-configs';

export interface BaseConfig extends cdk.StackProps {
    instanceSize: InstanceSize;
    ec2KeyName: string;
    volumeSizeGiB: number;
    niceDCVDisplayDriverUrl: string;
    niceDCVServerUrl: string;
    sevenZipUrl: string;
    chromeUrl: string;
    gridSwCertUrl: string;
    openPorts: number[];
    allowInboundCidr: string;
    associateElasticIp: boolean;
}

export abstract class BaseEc2Stack extends cdk.Stack {
  protected props: BaseConfig;

    protected abstract getInstanceType(): ec2.InstanceType;

    protected abstract getMachineImage(): ec2.IMachineImage;

    protected abstract getGpuType(): string;

    constructor(scope: Construct, id: string, props: BaseConfig) {
      super(scope, id, props);
      this.props = props;

      // Create the VPC.
      const vpc = this.createVPC();

      // Create the Security Group
      const securityGroup = this.createSecurityGroup(vpc);

      // Create the IAM Role for S3 read access.
      const s3ReadRole = this.createS3ReadRole(id);

      // Create the launch template
      const launchTemplate = this.createLaunchTemplate(vpc, securityGroup);

      // Create the EC2 Instance
      this.createEc2Instance(vpc, securityGroup, s3ReadRole, launchTemplate);
    }

    /**
     * Create a VPC with predefined configuration
     * @returns {ec2.Vpc} The created AWS VPC instance
     */
    private createVPC(cidr: string = '10.0.0.0/16'): ec2.Vpc {
      const vpc = new ec2.Vpc(this, 'CloudGamingVPC', {
        ipAddresses: ec2.IpAddresses.cidr(cidr),
        maxAzs: 1,
        subnetConfiguration: [
          {
            cidrMask: 28,
            name: 'Public',
            subnetType: ec2.SubnetType.PUBLIC,
          },
        ],
      });
      return vpc;
    }

    /**
     * Creates a security group for the EC2 instance.
     * @param vpc The VPC within which the security group will be created.
     * @returns {ec2.SecurityGroup} The created AWS EC2 Security Group instance.
     */
    private createSecurityGroup(vpc: ec2.Vpc): ec2.SecurityGroup {
      const securityGroup = new ec2.SecurityGroup(this, 'SecurityGroup', {
        vpc,
        description: 'NICE DCV access',
        securityGroupName: 'InboundAccessFromDcv',
      });

      // Configure the inbound security group rules
      this.props.openPorts.forEach((port) => {
        securityGroup.connections.allowFrom(
          ec2.Peer.ipv4(this.props.allowInboundCidr),
          ec2.Port.tcp(port),
        );
        securityGroup.connections.allowFrom(
          ec2.Peer.ipv4(this.props.allowInboundCidr),
          ec2.Port.udp(port),
        );
      });

      return securityGroup;
    }

    /**
     * Create an IAM role that allows EC2 instances to read from specific S3 buckets.
     * @param id The unique identifier for the role.
     * @returns {iam.Role} The created IAM role with S3 read permissions.
     */
    private createS3ReadRole(id: string): iam.Role {
      const role = new iam.Role(this, `${id}S3Read`, {
        roleName: `${id}.GamingDriverS3Access`,
        assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      });

      role.addToPolicy(
        new iam.PolicyStatement({
          resources: [
            `arn:aws:s3:::dcv-license.${this.region}/*`,
            'arn:aws:s3:::nvidia-gaming/*',
            `arn:aws:s3:::dcv-license.${this.region}`,
            'arn:aws:s3:::nvidia-gaming',
            'arn:aws:s3:::ec2-amd-windows-drivers',
            'arn:aws:s3:::ec2-amd-windows-drivers/*',
          ],
          actions: ['s3:GetObject', 's3:ListBucket'],
        }),
      );

      return role;
    }

    /**
     * Create an EC2 launch template with configuration for network interfaces and security groups.
     * @param vpc The VPC for which the launch template network interfaces will be configured.
     * @param securityGroup The security group to associate with the network interfaces.
     * @returns {ec2.CfnLaunchTemplate} The created EC2 launch template.
     */
    private createLaunchTemplate(
      vpc: ec2.Vpc,
      securityGroup: ec2.SecurityGroup,
    ): ec2.CfnLaunchTemplate {
      const launchTemplate = new ec2.CfnLaunchTemplate(
        this,
        'GamingLaunchTemplate',
        {
          launchTemplateData: {
            keyName: this.props.ec2KeyName,
            instanceType: this.getInstanceType().toString(),
            networkInterfaces: [
              {
                subnetId: vpc.selectSubnets({
                  subnetType: ec2.SubnetType.PUBLIC,
                }).subnetIds[0],
                deviceIndex: 0,
                description: 'ENI',
                groups: [securityGroup.securityGroupId],
              },
            ],
          },
          launchTemplateName: `GamingInstanceLaunchTemplate/${this.getInstanceType().toString()}`,
        },
      );

      return launchTemplate;
    }

    /**
     * Create and configure an EC2 instance with the necessary initialization scripts.
     * Outputs relevant instance information.
     * @param vpc The VPC where the instance will be launched.
     * @param securityGroup The security group to attach to the instance.
     * @param s3ReadRole The IAM role to associate with the instance for S3 permissions.
     */
    private createEc2Instance(
      vpc: ec2.Vpc,
      securityGroup: ec2.SecurityGroup,
      s3ReadRole: iam.Role,
      launchTemplate: ec2.CfnLaunchTemplate,
    ): void {
      const nvidiaConfigs = getNvidiaConfigs(this.props);
      const amdConfigs = getAMDConfigs(this.props);

      const ec2Instance = new ec2.Instance(this, 'EC2Instance', {
        instanceType: this.getInstanceType(),
        vpc,
        securityGroup,
        vpcSubnets: vpc.selectSubnets({
          subnetType: ec2.SubnetType.PUBLIC,
        }),
        keyName: this.props.ec2KeyName,
        machineImage: this.getMachineImage(),
        blockDevices: [
          {
            deviceName: '/dev/sda1',
            volume: ec2.BlockDeviceVolume.ebs(
              this.props.volumeSizeGiB,
              {
                volumeType: ec2.EbsDeviceVolumeType.GP3,
              },
            ),
          },
        ],
        role: s3ReadRole,
        init: ec2.CloudFormationInit.fromConfigSets({
          configSets: {
            // Seperate configSets and specific order depending on EC2 Instance Type
            NVIDIA: [
              'helpersPreinstall',
              'nvidia',
              'nvidiadcv',
              'reboot',
            ],
            AMD: [
              'helpersPreinstall',
              'amd',
              'amddcv',
              'reboot'
            ],
          },
          configs: {
            helpersPreinstall: new ec2.InitConfig([
              // Installes 7zip, needed for Nvidia install, and Chrome Enterprise.
              ec2.InitPackage.msi(this.props.sevenZipUrl, {
                key: '1-Install-SevenZip',
              }),
              ec2.InitPackage.msi(this.props.chromeUrl, {
                key: '2-Install-Chrome-Enterprise-x64',
              }),
            ]),
            ...nvidiaConfigs,
            ...amdConfigs,
            reboot: new ec2.InitConfig([
              // Command to reboot instance and apply registry changes.
              ec2.InitCommand.shellCommand(
                'powershell.exe -Command Restart-Computer -force',
                {
                  key: '92-restart',
                  waitAfterCompletion:
                                    ec2.InitCommandWaitDuration.forever(),
                },
              ),
              ec2.InitCommand.shellCommand(
                '"C:\\Program Files\\NICE\\DCV\\Server\\bin\\dcv.exe" list-sessions"',
                {
                  key: '93-check',
                  waitAfterCompletion:
                                    ec2.InitCommandWaitDuration.of(
                                      cdk.Duration.seconds(5),
                                    ),
                },
              ),
              ec2.InitCommand.shellCommand(
                `cfn-signal.exe -e %ERRORLEVEL% --resource EC2Instance --stack ${this.stackId} --region ${this.region}`,
                {
                  key: '94-Signal',
                  waitAfterCompletion:
                                    ec2.InitCommandWaitDuration.of(
                                      cdk.Duration.seconds(5),
                                    ),
                },
              ),
            ]),
          },
        }),
        initOptions: {
          // Optional, which configsets to activate (['default'] by default)
          configSets: [this.getGpuType()],

          // Optional, how long the installation is expected to take (5 minutes by default)
          timeout: cdk.Duration.minutes(15),

          // Optional, whether to include the --url argument when running cfn-init and cfn-signal commands (false by default)
          includeUrl: true,

          // Optional, whether to include the --role argument when running cfn-init and cfn-signal commands (false by default)
          // includeRole: true,
        },
        instanceName: `GamingInstance/${this.getInstanceType().toString()}`,
      });

      // Needed as cdk created hashed LogicalID and CFN signal does not work after reboot,
      // so we have to hardcode the Logical Name in the signal (line #136)
      ec2Instance.instance.overrideLogicalId('EC2Instance');

      // Either reserve elastic IP or get instance public IP
      const ip = this.props.associateElasticIp
        ? new ec2.CfnEIP(this, 'Gaming', {
          instanceId: ec2Instance.instanceId,
        }).ref
        : ec2Instance.instancePublicIp;

      // Generate outputs related to EC2 instance like public IP, instance ID, etc.
      this.generateInstanceOutputs(ec2Instance, ip, launchTemplate);
    }

    /**
     * Generate CloudFormation outputs for the created EC2 instance.
     * @param ec2Instance The EC2 instance that was created in the stack.
     */
    private generateInstanceOutputs(
      ec2Instance: ec2.Instance,
      ip: string,
      launchTemplate: ec2.CfnLaunchTemplate,
    ): void {
      new cdk.CfnOutput(this, 'Credentials', {
        value: `https://${this.region}.console.aws.amazon.com/ec2/v2/home?region=${this.region}#GetWindowsPassword:instanceId=${ec2Instance.instanceId};previousPlace=ConnectToInstance`,
      });
      new cdk.CfnOutput(this, 'InstanceId', {
        value: ec2Instance.instanceId,
      });
      new cdk.CfnOutput(this, 'KeyName', { value: this.props.ec2KeyName });
      new cdk.CfnOutput(this, 'LaunchTemplateId', {
        value: launchTemplate.launchTemplateName!,
      });
      new cdk.CfnOutput(this, 'Public IP', {
        value: ip,
      });
    }
}

import {
  BlockDeviceVolume, CfnEIP,
  CfnLaunchTemplate, EbsDeviceVolumeType,
  Instance,
  InstanceSize, MachineImage,
  Peer,
  Port,
  SecurityGroup,
  SubnetType, UserData,
  Vpc, WindowsVersion,
  InstanceType, IpAddresses,
} from 'aws-cdk-lib/aws-ec2';
import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';

export interface BaseConfig extends StackProps {
    instanceSize: InstanceSize;
    sshKeyName: string;
    volumeSizeGiB: number;
    niceDCVDisplayDriverUrl: string;
    niceDCVServerUrl: string;
    openPorts: number[];
    allowInboundCidr: string;
    associateElasticIp: boolean;
}

export abstract class BaseEc2Stack extends Stack {
  protected props: BaseConfig;

  constructor(scope: Construct, id: string, props: BaseConfig) {
    super(scope, id, props);
    this.props = props;
    const vpc = new Vpc(this, 'CloudGamingVPC', {
      ipAddresses: IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 1,
      subnetConfiguration: [
        {
          cidrMask: 28,
          name: 'Public',
          subnetType: SubnetType.PUBLIC,
        },
      ],
    });

    const securityGroup = new SecurityGroup(this, 'SecurityGroup', {
      vpc,
      description: 'Allow RDP and NICE DCV access',
      securityGroupName: 'InboundAccessFromRdpDcv',
    });

    for (const port of this.props.openPorts) {
      securityGroup.connections.allowFrom(Peer.ipv4(this.props.allowInboundCidr), Port.tcp(port));
    }

    const s3Read = new Role(this, `${id}S3Read`, {
      roleName: `${id}.GraphicsDriverS3Access`,
      assumedBy: new ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('AmazonS3ReadOnlyAccess'),
      ],
    });

    const launchTemplate = new CfnLaunchTemplate(this, 'GamingLaunchTemplate', {
      launchTemplateData: {
        keyName: props.sshKeyName,
        instanceType: this.getInstanceType().toString(),
        networkInterfaces: [{
          subnetId: vpc.selectSubnets({ subnetType: SubnetType.PUBLIC }).subnetIds[0],
          deviceIndex: 0,
          description: 'ENI',
          groups: [securityGroup.securityGroupId],
        }],
      },
      launchTemplateName: `GamingInstanceLaunchTemplate/${this.getInstanceType().toString()}`,
    });

    const ec2Instance = new Instance(this, 'EC2Instance', {
      instanceType: this.getInstanceType(),
      vpc,
      securityGroup,
      vpcSubnets: vpc.selectSubnets({ subnetType: SubnetType.PUBLIC }),
      keyName: props.sshKeyName,
      userData: this.getUserdata(),
      machineImage: MachineImage.latestWindows(WindowsVersion.WINDOWS_SERVER_2019_ENGLISH_FULL_BASE),
      blockDevices: [
        {
          deviceName: '/dev/sda1',
          volume: BlockDeviceVolume.ebs(props.volumeSizeGiB, {
            volumeType: EbsDeviceVolumeType.GP3,
          }),
        },
      ],
      role: s3Read,
      instanceName: `GamingInstance/${this.getInstanceType().toString()}`,
    });

    if (this.props.associateElasticIp) {
      const elasticIp = new CfnEIP(this, 'Gaming', {
        instanceId: ec2Instance.instanceId,
      });

      new CfnOutput(this, 'Public IP', { value: elasticIp.ref });
    } else {
      new CfnOutput(this, 'Public IP', { value: ec2Instance.instancePublicIp });
    }

    new CfnOutput(this, 'Credentials', { value: `https://${this.region}.console.aws.amazon.com/ec2/v2/home?region=${this.region}#ConnectToInstance:instanceId=${ec2Instance.instanceId}` });
    new CfnOutput(this, 'InstanceId', { value: ec2Instance.instanceId });
    new CfnOutput(this, 'KeyName', { value: props.sshKeyName });
    new CfnOutput(this, 'LaunchTemplateId', { value: launchTemplate.launchTemplateName! });
  }

    protected abstract getUserdata(): UserData;

    protected abstract getInstanceType(): InstanceType;
}

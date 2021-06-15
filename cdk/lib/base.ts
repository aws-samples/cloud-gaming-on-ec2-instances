/* tslint:disable:no-submodule-imports quotemark no-unused-expression */
import * as ec2 from "@aws-cdk/aws-ec2";
import { InstanceSize } from "@aws-cdk/aws-ec2/lib/instance-types";
import { ManagedPolicy, Role, ServicePrincipal } from "@aws-cdk/aws-iam";
import * as cdk from '@aws-cdk/core';

export interface BaseConfig extends cdk.StackProps {
    instanceSize: InstanceSize;
    sshKeyName: string;
    volumeSizeGiB: number;
    niceDCVDisplayDriverUrl: string;
    niceDCVServerUrl: string;
    openPorts: number[];
    allowInboundCidr: string;
    associateElasticIp: boolean;
}

export abstract class BaseEc2Stack extends cdk.Stack {
    protected props: BaseConfig;

    constructor(scope: cdk.Construct, id: string, props: BaseConfig) {
        super(scope, id, props);
        this.props = props;
        const vpc = new ec2.Vpc(this, "CloudGamingVPC", {
            cidr: `10.0.0.0/16`,
            maxAzs: 1,
            subnetConfiguration: [
                {
                    cidrMask: 28,
                    name: `Public`,
                    subnetType: ec2.SubnetType.PUBLIC
                }
            ]
        });

        const securityGroup = new ec2.SecurityGroup(this, 'SecurityGroup', {
            vpc,
            description: 'Allow RDP and NICE DCV access',
            securityGroupName: 'InboundAccessFromRdpDcv'
        });

        for (const port of this.props.openPorts) {
            securityGroup.connections.allowFrom(ec2.Peer.ipv4(this.props.allowInboundCidr), ec2.Port.tcp(port));
        }

        const s3Read = new Role(this, `${id}S3Read`, {
            roleName: `${id}.GraphicsDriverS3Access`,
            assumedBy: new ServicePrincipal('ec2.amazonaws.com'),
            managedPolicies: [
                ManagedPolicy.fromAwsManagedPolicyName('AmazonS3ReadOnlyAccess')
            ],
        });

        const launchTemplate = new ec2.CfnLaunchTemplate(this, "GamingLaunchTemplate", {
            launchTemplateData: {
                keyName: props.sshKeyName,
                instanceType: this.getInstanceType().toString(),
                networkInterfaces: [{
                    subnetId: vpc.selectSubnets({ subnetType: ec2.SubnetType.PUBLIC }).subnetIds[0],
                    deviceIndex: 0,
                    description: "ENI",
                    groups: [securityGroup.securityGroupId]
                }]
            },
            launchTemplateName: `GamingInstanceLaunchTemplate/${this.getInstanceType().toString()}`,
        });

        const ec2Instance = new ec2.Instance(this, "EC2Instance", {
            instanceType: this.getInstanceType(),
            vpc,
            securityGroup,
            vpcSubnets: vpc.selectSubnets({ subnetType: ec2.SubnetType.PUBLIC }),
            keyName: props.sshKeyName,
            userData: this.getUserdata(),
            machineImage: ec2.MachineImage.latestWindows(ec2.WindowsVersion.WINDOWS_SERVER_2019_ENGLISH_FULL_BASE),
            blockDevices: [
                {
                    deviceName: "/dev/sda1",
                    volume: ec2.BlockDeviceVolume.ebs(props.volumeSizeGiB, {
                        volumeType: ec2.EbsDeviceVolumeType.GP3
                    }),
                }
            ],
            role: s3Read,
            instanceName: `GamingInstance/${this.getInstanceType().toString()}`
        });

        if (this.props.associateElasticIp) {
            const elasticIp = new ec2.CfnEIP(this, "Gaming", {
                instanceId: ec2Instance.instanceId
            });

            new cdk.CfnOutput(this, `Public IP`, { value: elasticIp.ref });
        } else {
            new cdk.CfnOutput(this, `Public IP`, { value: ec2Instance.instancePublicIp });
        }

        new cdk.CfnOutput(this, `Credentials`, { value: `https://${this.region}.console.aws.amazon.com/ec2/v2/home?region=${this.region}#ConnectToInstance:instanceId=${ec2Instance.instanceId}` });
        new cdk.CfnOutput(this, `InstanceId`, { value: ec2Instance.instanceId });
        new cdk.CfnOutput(this, `KeyName`, { value: props.sshKeyName });
        new cdk.CfnOutput(this, `LaunchTemplateId`, { value: launchTemplate.launchTemplateName! });
    }

    protected abstract getUserdata(): ec2.UserData;

    protected abstract getInstanceType(): ec2.InstanceType;
}




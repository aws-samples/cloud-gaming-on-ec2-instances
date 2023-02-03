/* tslint:disable:no-submodule-imports quotemark no-unused-expression */
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Stack, CfnElement } from 'aws-cdk-lib';
import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";
import { InstanceSize } from "aws-cdk-lib/aws-ec2/lib/instance-types";
import { ManagedPolicy, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { InitCommandWaitDuration } from 'aws-cdk-lib/aws-ec2';
import { cwd } from 'process';

export interface BaseConfig extends cdk.StackProps {
    instanceSize: InstanceSize;
    sshKeyName: string;
    volumeSizeGiB: number;
    niceDCVDisplayDriverUrl: string;
    niceDCVServerUrl: string;
    gpu: string;
    sevenzip: string,
    chromeUrl: string,
    gridSwCertUrl: string,
    openPorts: number[];
    allowInboundCidr: string;
    associateElasticIp: boolean;
    
}

export abstract class BaseEc2Stack extends cdk.Stack {
    protected props: BaseConfig;
    
    constructor(scope: Construct, id: string, props: BaseConfig) {
        super(scope, id, props);
        this.props = props;
        const vpc = new ec2.Vpc(this, "CloudGamingVPC", {
            ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
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
            roleName: `${id}.GamingDriverS3Access`,
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
            machineImage: ec2.MachineImage.latestWindows(ec2.WindowsVersion.WINDOWS_SERVER_2022_ENGLISH_FULL_BASE),
            blockDevices: [
                {
                    deviceName: "/dev/sda1",
                    volume: ec2.BlockDeviceVolume.ebs(props.volumeSizeGiB, {
                        volumeType: ec2.EbsDeviceVolumeType.GP3
                    }),
                }
            ],
            role: s3Read,
            init: ec2.CloudFormationInit.fromConfigSets({
                configSets: {
                  // Seperate configSets and specific order depending on EC2 Instance Type
                  NVIDIA: ['helpersPreinstall', 'nvidia', 'nvidiadcv','reboot'],
                  AMD: ['helpersPreinstall', 'amd', 'amddcv','reboot'],
                },
                configs: {
                  helpersPreinstall: new ec2.InitConfig([
                    // Installes 7zip, needed for Nvidia install, and Chrome Enterprise.
                    ec2.InitPackage.msi(this.props.sevenzip, { key: "1-Install-SevenZip" }),                
                    ec2.InitPackage.msi(this.props.chromeUrl, { key: "2-Install-Chrome-Enterprise-x64" }),
                  ]),
                  nvidiadcv: new ec2.InitConfig([
                    // Install NiceDCV #needs to updated with latest version in "cloud-gaming-on-ec2.ts" if a later version is released.
                    ec2.InitPackage.msi(this.props.niceDCVServerUrl, { key: "3-Install-NICEDCV-Server" }),
                    ec2.InitPackage.msi(this.props.niceDCVDisplayDriverUrl, { key: "4-Install-NICEDCV-Display" }),
                    ec2.InitCommand.shellCommand('reg add "HKEY_USERS\\S-1-5-18\\Software\\GSettings\\com\\nicesoftware\\dcv\\session-management\\automatic-console-session" /v owner /t REG_SZ /d Administrator /f', { key: "91-Add-Reg" ,waitAfterCompletion: ec2.InitCommandWaitDuration.of(cdk.Duration.seconds(0)) }),
                  ]),
                  amddcv: new ec2.InitConfig([
                    // Install NiceDCV #needs to updated with latest version in "cloud-gaming-on-ec2.ts" if a later version is released.
                    ec2.InitPackage.msi(this.props.niceDCVServerUrl, { key: "3-Install-NICEDCV-Server" }),
                    ec2.InitCommand.shellCommand('reg add "HKEY_USERS\\S-1-5-18\\Software\\GSettings\\com\\nicesoftware\\dcv\\session-management\\automatic-console-session" /v owner /t REG_SZ /d Administrator /f', { key: "91-Add-Reg" ,waitAfterCompletion: ec2.InitCommandWaitDuration.of(cdk.Duration.seconds(0)) }),
                  ]),
                  nvidia: new ec2.InitConfig([
                    // Download GRID Certificate.
                    ec2.InitFile.fromUrl('C:\\Users\\PUBLIC\\Documents\\GridSwCert.txt', this.props.gridSwCertUrl),
                    // Command to download, extract, configure, install, and register latest Nvidia drivers.  
                    ec2.InitCommand.shellCommand('powershell.exe -Command "$InstallationFilesFolder = \'C:\\Users\\Administrator\\Desktop\\InstallationFiles\'; $Bucket = \'nvidia-gaming\'; $KeyPrefix = \'windows/latest\'; $Objects = Get-S3Object -BucketName $Bucket -KeyPrefix $KeyPrefix -Region us-east-1; foreach ($Object in $Objects) { $LocalFileName = $Object.Key; if ($LocalFileName -ne \'\' -and $Object.Size -ne 0) { $LocalFilePath = Join-Path $InstallationFilesFolder\\1_NVIDIA_drivers $LocalFileName; Copy-S3Object -BucketName $Bucket -Key $Object.Key -LocalFile $LocalFilePath -Region us-east-1 } }"', { key: "5-Download-NVIDIA-Drivers", waitAfterCompletion: ec2.InitCommandWaitDuration.of(cdk.Duration.seconds(0)) }),
                    ec2.InitCommand.shellCommand('powershell.exe -Command "$InstallationFilesFolder = \'C:\\Users\\Administrator\\Desktop\\InstallationFiles\'; $extractFolder = \\\"$InstallationFilesFolder\\1_NVIDIA_drivers\\windows\\latest\\\"; $filesToExtract = \'Display.Driver HDAudio NVI2 PhysX EULA.txt ListDevices.txt setup.cfg setup.exe\'; $Bucket = \'nvidia-gaming\';  $KeyPrefix = \'windows/latest\'; $Objects = Get-S3Object -BucketName $Bucket -KeyPrefix $KeyPrefix -Region us-east-1; foreach ($Object in $Objects) { $LocalFileName = $Object.Key; if ($LocalFileName -ne \'\' -and $Object.Size -ne 0) { $LocalFilePath = Join-Path $InstallationFilesFolder\\1_NVIDIA_drivers $LocalFileName }}; Start-Process -FilePath \'C:\\Program Files\\7-Zip\\7z.exe\' -NoNewWindow -ArgumentList \\\"x -bso0 -bsp1 -bse1 -aoa $LocalFilePath $filesToExtract -o\\\"\\\"$extractFolder\\\"\\\"\\\" -wait; "', { key: "6-Extract-NVIDIA-drivers", waitAfterCompletion: ec2.InitCommandWaitDuration.of(cdk.Duration.seconds(0)) }),
                    ec2.InitCommand.shellCommand('Powershell (Get-Content "C:\\Users\\Administrator\\Desktop\\InstallationFiles\\1_NVIDIA_drivers\\windows\\latest\\setup.cfg") | powershell Where-Object { $_ -notmatch \'name="${{(EulaHtmlFile|FunctionalConsentFile|PrivacyPolicyFile)}}\' } | Set-Content "C:\\Users\\Administrator\\Desktop\\InstallationFiles\\1_NVIDIA_drivers\\windows\\latest\\setup.cfg" -Encoding UTF8 -Force', { key: "7-Create-NVIDIA-driver-Installer", waitAfterCompletion: ec2.InitCommandWaitDuration.of(cdk.Duration.seconds(0)) }),
                    ec2.InitCommand.shellCommand('Powershell.exe -Command "$install_args = \'-passive -noreboot -noeula -nofinish -s\'; Start-Process -FilePath \'C:\\Users\\Administrator\\Desktop\\InstallationFiles\\1_NVIDIA_drivers\\windows\\latest\\setup.exe\' -ArgumentList $install_args -wait;"', { key: "8-Install-NVIDIA-drivers", waitAfterCompletion: ec2.InitCommandWaitDuration.of(cdk.Duration.seconds(0)) }),
                    ec2.InitCommand.shellCommand('reg add "HKLM\\SYSTEM\\CurrentControlSet\\Services\\nvlddmkm\\Global" /v vGamingMarketplace /t REG_DWORD /d 2', { key: "9-Add-Reg" , waitAfterCompletion: ec2.InitCommandWaitDuration.of(cdk.Duration.seconds(0)) }),
                  ]),
                  amd: new ec2.InitConfig([
                    // Command to download and install latest AMD drivers.
                    ec2.InitCommand.shellCommand('powershell.exe -Command "$InstallationFilesFolder = \'C:\\Users\\Administrator\\Desktop\\InstallationFiles\'; $Bucket = \'ec2-amd-windows-drivers\'; $KeyPrefix = \'latest\'; $Objects = Get-S3Object -BucketName $Bucket -KeyPrefix $KeyPrefix -Region us-east-1; foreach ($Object in $Objects) { $LocalFileName = $Object.Key; if ($LocalFileName -ne \'\' -and $Object.Size -ne 0) { $LocalFilePath = Join-Path $InstallationFilesFolder\\1_AMD_driver $LocalFileName; Copy-S3Object -BucketName $Bucket -Key $Object.Key -LocalFile $LocalFilePath -Region us-east-1;  Expand-Archive $LocalFilePath -DestinationPath $InstallationFilesFolder\\1_AMD_driver } }"', { key: "5-Download-AMD-Drivers", waitAfterCompletion: ec2.InitCommandWaitDuration.of(cdk.Duration.seconds(0)) }),
                    ec2.InitCommand.shellCommand('pnputil /add-driver C:\\Users\\Administrator\\Desktop\\InstallationFiles\\1_AMD_driver\\Packages\\Drivers\\Display\\WT6A_INF\\*.inf /install', { key: "6-Install-AMD-Drivers", waitAfterCompletion: ec2.InitCommandWaitDuration.of(cdk.Duration.seconds(0)) }),
                  ]),
                  reboot: new ec2.InitConfig([
                    // Command to reboot instance and apply registry changes.
                    ec2.InitCommand.shellCommand('powershell.exe -Command Restart-Computer -force', {key: "92-restart" ,waitAfterCompletion: ec2.InitCommandWaitDuration.forever()}),
                    ec2.InitCommand.shellCommand('"C:\\Program Files\\NICE\\DCV\\Server\\bin\\dcv.exe" list-sessions"', { key: "93-check" ,waitAfterCompletion: ec2.InitCommandWaitDuration.of(cdk.Duration.seconds(5)) }),
                    ec2.InitCommand.shellCommand('cfn-signal.exe -e %ERRORLEVEL% --resource EC2Instance --stack ' + this.stackId + ' --region ' + this.region, { key: "94-Signal", waitAfterCompletion: ec2.InitCommandWaitDuration.of(cdk.Duration.seconds(5)) })
                  ]),
                },
              }),
              initOptions: {
                // Optional, which configsets to activate (['default'] by default)
                configSets: [this.props.gpu],
              
                // Optional, how long the installation is expected to take (5 minutes by default)
                timeout: cdk.Duration.minutes(15),
              
                // Optional, whether to include the --url argument when running cfn-init and cfn-signal commands (false by default)
                includeUrl: true,
              
                // Optional, whether to include the --role argument when running cfn-init and cfn-signal commands (false by default)
                //includeRole: true,
              },
            instanceName: `GamingInstance/${this.getInstanceType().toString()}`
        });
        // Needed as cdk created hashed LogicalID and CFN signal does not work after reboot, so we have to hardcode the Logical Name in the signal (line #136)
        ec2Instance.instance.overrideLogicalId('EC2Instance');

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
    protected abstract getInstanceType(): ec2.InstanceType;
}




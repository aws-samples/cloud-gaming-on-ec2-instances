import * as cdk from "@aws-cdk/core";
import * as ec2 from "@aws-cdk/aws-ec2";
import { BaseConfig, BaseEc2Stack } from "./base";

export interface G4DNConfig extends BaseConfig {
    gridSwCertUrl: string;
}

export class G4DNStack extends BaseEc2Stack {
    protected props: G4DNConfig;

    constructor(scope: cdk.Construct, id: string, props: G4DNConfig) {
        super(scope, id, props);
    }

    protected getInstanceType() {
        return ec2.InstanceType.of(ec2.InstanceClass.G4DN, ec2.InstanceSize.XLARGE);
    }

    protected getUserdata() {
        const userData = ec2.UserData.forWindows();
        userData.addCommands(
            `$NiceDCVDisplayDrivers = "${this.props.niceDCVDisplayDriverUrl}"`,
            `$NiceDCVServer = "${this.props.niceDCVServerUrl}"`,
            `$InstallationFilesFolder = "$home\\Desktop\\InstallationFiles"`,
            `$Bucket = "nvidia-gaming"`,
            `$KeyPrefix = "windows/latest"`,
            `$LocalTempPath = "$home\\Desktop\\temp"`,
            `$Objects = Get-S3Object -BucketName $Bucket -KeyPrefix $KeyPrefix -Region us-east-1`,
            `foreach ($Object in $Objects) {
                $LocalFileName = $Object.Key
                if ($LocalFileName -ne '' -and $Object.Size -ne 0) {
                    $LocalFilePath = Join-Path $LocalTempPath $LocalFileName
                    Copy-S3Object -BucketName $Bucket -Key $Object.Key -LocalFile $LocalFilePath -Region us-east-1
                }
            }`,
            'Expand-Archive $LocalFilePath -DestinationPath $InstallationFilesFolder\\1_NVIDIA_drivers',
            'Invoke-WebRequest -Uri $NiceDCVServer -OutFile $InstallationFilesFolder\\2_NICEDCV-Server.msi',
            'Invoke-WebRequest -Uri $NiceDCVDisplayDrivers -OutFile $InstallationFilesFolder\\3_NICEDCV-DisplayDriver.msi',
            `'reg add "HKLM\\SOFTWARE\\NVIDIA Corporation\\Global" /v vGamingMarketplace /t REG_DWORD /d 2' >> $InstallationFilesFolder\\4_update_registry.ps1`,
            'Remove-Item $LocalTempPath -Recurse',
            `Invoke-WebRequest -Uri "${this.props.gridSwCertUrl}" -OutFile "$Env:PUBLIC\\Documents\\GridSwCert.txt"`,
            `'' >> $InstallationFilesFolder\\OK`
        );

        return userData;
    }
}

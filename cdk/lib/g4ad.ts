import * as cdk from "@aws-cdk/core";
import * as ec2 from "@aws-cdk/aws-ec2";
import { BaseConfig, BaseEc2Stack } from "./base";

// tslint:disable-next-line:no-empty-interface
export interface G4ADConfig extends BaseConfig {

}

export class G4ADStack extends BaseEc2Stack {
    protected props: G4ADConfig;

    constructor(scope: cdk.Construct, id: string, props: G4ADConfig) {
        super(scope, id, props);
    }

    protected getUserdata() {
        const userData = ec2.UserData.forWindows();
        userData.addCommands(
            `$NiceDCVDisplayDrivers = "${this.props.niceDCVDisplayDriverUrl}"`,
            `$NiceDCVServer = "${this.props.niceDCVServerUrl}"`,
            `$InstallationFilesFolder = "$home\\Desktop\\InstallationFiles"`,
            `$Bucket = "ec2-amd-windows-drivers"`,
            `$KeyPrefix = "latest"`,
            `$Objects = Get-S3Object -BucketName $Bucket -KeyPrefix $KeyPrefix -Region us-east-1`,
            `foreach ($Object in $Objects) {
                $LocalFileName = $Object.Key
                if ($LocalFileName -ne '' -and $Object.Size -ne 0) {
                    $LocalFilePath = Join-Path $InstallationFilesFolder $LocalFileName
                    Copy-S3Object -BucketName $Bucket -Key $Object.Key -LocalFile $LocalFilePath -Region us-east-1
                    Expand-Archive $LocalFilePath -DestinationPath $InstallationFilesFolder\\1_AMD_driver
                }
            }`,
            'Invoke-WebRequest -Uri $NiceDCVServer -OutFile $InstallationFilesFolder\\2_NICEDCV-Server.msi',
            'Invoke-WebRequest -Uri $NiceDCVDisplayDrivers -OutFile $InstallationFilesFolder\\3_NICEDCV-DisplayDriver.msi',
            'Remove-Item $InstallationFilesFolder\\latest -Recurse',
            `'' >> $InstallationFilesFolder\\OK`
        );

        return userData;
    }

    protected getInstanceType() {
        return new ec2.InstanceType(`g4ad.${this.props.instanceSize}`);
    }
}

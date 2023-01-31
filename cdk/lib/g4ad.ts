import { BaseConfig, BaseEc2Stack } from "./base";
import { Construct } from "constructs";
import { InstanceType, UserData } from "aws-cdk-lib/aws-ec2";

// tslint:disable-next-line:no-empty-interface
export interface G4ADConfig extends BaseConfig {

}

export class G4ADStack extends BaseEc2Stack {
    protected props: G4ADConfig;

    constructor(scope: Construct, id: string, props: G4ADConfig) {
        super(scope, id, props);
    }

    protected getUserdata() {
        const userData = UserData.forWindows();
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
        return new InstanceType(`g4ad.${this.props.instanceSize}`);
    }
}

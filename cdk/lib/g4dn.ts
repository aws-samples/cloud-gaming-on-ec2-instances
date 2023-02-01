import { Construct } from 'constructs';
import { InstanceClass, InstanceType, UserData } from 'aws-cdk-lib/aws-ec2';
import { BaseConfig, BaseEc2Stack } from './base';

export interface G4DNConfig extends BaseConfig {
  gridSwCertUrl: string;
}

export class G4DNStack extends BaseEc2Stack {
  protected props: G4DNConfig;

  // eslint-disable-next-line no-useless-constructor
  constructor(scope: Construct, id: string, props: G4DNConfig) {
    super(scope, id, props);
  }

  protected getInstanceType() {
    return InstanceType.of(InstanceClass.G4DN, this.props.instanceSize);
  }

  protected getUserdata() {
    const userData = UserData.forWindows();
    userData.addCommands(
      `$NiceDCVDisplayDrivers = "${this.props.niceDCVDisplayDriverUrl}"`,
      `$NiceDCVServer = "${this.props.niceDCVServerUrl}"`,
      '$InstallationFilesFolder = "$home\\Desktop\\InstallationFiles"',
      '$Bucket = "nvidia-gaming"',
      '$KeyPrefix = "windows/latest"',
      '$Objects = Get-S3Object -BucketName $Bucket -KeyPrefix $KeyPrefix -Region us-east-1',
      `foreach ($Object in $Objects) {
                $LocalFileName = $Object.Key
                if ($LocalFileName -ne '' -and $Object.Size -ne 0) {
                    $LocalFilePath = Join-Path $InstallationFilesFolder\\1_NVIDIA_drivers $LocalFileName
                    Copy-S3Object -BucketName $Bucket -Key $Object.Key -LocalFile $LocalFilePath -Region us-east-1
                }
            }`,
      'Invoke-WebRequest -Uri $NiceDCVServer -OutFile $InstallationFilesFolder\\2_NICEDCV-Server.msi',
      'Invoke-WebRequest -Uri $NiceDCVDisplayDrivers -OutFile $InstallationFilesFolder\\3_NICEDCV-DisplayDriver.msi',
      '\'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Services\\nvlddmkm\\Global" /v vGamingMarketplace /t REG_DWORD /d 2\' >> $InstallationFilesFolder\\4_update_registry.ps1',
      `Invoke-WebRequest -Uri "${this.props.gridSwCertUrl}" -OutFile "$Env:PUBLIC\\Documents\\GridSwCert.txt"`,
      '\'\' >> $InstallationFilesFolder\\OK',
    );

    return userData;
  }
}

import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as cdk from 'aws-cdk-lib';
import { BaseConfig } from '../base';

export function getAMDConfigs(props: BaseConfig): {
    amd: ec2.InitConfig;
    amddcv: ec2.InitConfig;
} {
  const amd = new ec2.InitConfig([
    // Command to download and install latest AMD drivers.
    ec2.InitCommand.shellCommand(
      "powershell.exe -Command \"$InstallationFilesFolder = 'C:\\Users\\Administrator\\Desktop\\InstallationFiles'; $Bucket = 'ec2-amd-windows-drivers'; $KeyPrefix = 'latest'; $Objects = Get-S3Object -BucketName $Bucket -KeyPrefix $KeyPrefix -Region us-east-1; foreach ($Object in $Objects) { $LocalFileName = $Object.Key; if ($LocalFileName -ne '' -and $Object.Size -ne 0) { $LocalFilePath = Join-Path $InstallationFilesFolder\\1_AMD_driver $LocalFileName; Copy-S3Object -BucketName $Bucket -Key $Object.Key -LocalFile $LocalFilePath -Region us-east-1;  Expand-Archive $LocalFilePath -DestinationPath $InstallationFilesFolder\\1_AMD_driver } }\"",
      {
        key: '5-Download-AMD-Drivers',
        waitAfterCompletion: ec2.InitCommandWaitDuration.of(
          cdk.Duration.seconds(0),
        ),
      },
    ),
    ec2.InitCommand.shellCommand(
      'pnputil /add-driver C:\\Users\\Administrator\\Desktop\\InstallationFiles\\1_AMD_driver\\Packages\\Drivers\\Display\\WT6A_INF\\*.inf /install /reboot',
      {
        key: '6-Install-AMD-Drivers',
        waitAfterCompletion: ec2.InitCommandWaitDuration.of(
          cdk.Duration.seconds(0),
        ),
      },
    ),
  ]);

  const amddcv = new ec2.InitConfig([
    // Install NiceDCV #needs to updated with latest version in "cloud-gaming-on-ec2.ts" if a later version is released.
    ec2.InitPackage.msi(props.niceDCVServerUrl, {
      key: '3-Install-NICEDCV-Server',
    }),
    ec2.InitCommand.shellCommand(
      'reg add "HKEY_USERS\\S-1-5-18\\Software\\GSettings\\com\\nicesoftware\\dcv\\log\\level" /v log-level /t REG_SZ /d debug /f',
      {
        key: '91-Add-Reg',
        waitAfterCompletion: ec2.InitCommandWaitDuration.of(
          cdk.Duration.seconds(0),
        ),
      },
    ),
    ec2.InitCommand.shellCommand(
      'reg add "HKEY_USERS\\S-1-5-18\\Software\\GSettings\\com\\nicesoftware\\dcv\\display" /v target-fps /t REG_DWORD /d 0 /f',
      {
        key: '92-Add-Reg',
        waitAfterCompletion: ec2.InitCommandWaitDuration.of(
          cdk.Duration.seconds(0),
        ),
      },
    ),
    ec2.InitCommand.shellCommand(
      'reg add "HKEY_USERS\\S-1-5-18\\Software\\GSettings\\com\\nicesoftware\\dcv\\display" /v enable-qu /t REG_DWORD /d 0 /f',
      {
        key: '93-Add-Reg',
        waitAfterCompletion: ec2.InitCommandWaitDuration.of(
          cdk.Duration.seconds(0),
        ),
      },
    ),
    ec2.InitCommand.shellCommand(
      'reg add "HKEY_USERS\\S-1-5-18\\Software\\GSettings\\com\\nicesoftware\\dcv\\display" /v frame-queue-weights /t REG_DWORD /d 851 /f',
      {
        key: '94-Add-Reg',
        waitAfterCompletion: ec2.InitCommandWaitDuration.of(
          cdk.Duration.seconds(0),
        ),
      },
    ),
    ec2.InitCommand.shellCommand(
      'reg add "HKEY_USERS\\S-1-5-18\\Software\\GSettings\\com\\nicesoftware\\dcv\\session-management\\connectivity-console-session" /v owner /t REG_SZ /d Administrator /f',
      {
        key: '95-Add-Reg',
        waitAfterCompletion: ec2.InitCommandWaitDuration.of(
          cdk.Duration.seconds(0),
        ),
      },
    ),
    ec2.InitCommand.shellCommand(
      'reg add "HKEY_USERS\\S-1-5-18\\Software\\GSettings\\com\\nicesoftware\\dcv\\connectivity" /v enable-quic-frontend /t REG_DWORD /d 1 /f',
      {
        key: '96-Add-Reg',
        waitAfterCompletion: ec2.InitCommandWaitDuration.of(
          cdk.Duration.seconds(0),
        ),
      },
    ),
  ]);

  return { amd, amddcv };
}

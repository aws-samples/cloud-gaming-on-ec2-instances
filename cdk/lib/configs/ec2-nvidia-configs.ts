import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as cdk from 'aws-cdk-lib';
import { BaseConfig } from '../base';

export function getNvidiaConfigs(props: BaseConfig): {
    nvidia: ec2.InitConfig;
    nvidiadcv: ec2.InitConfig;
} {
  const nvidia = new ec2.InitConfig([
    // Download GRID Certificate.
    ec2.InitFile.fromUrl(
      'C:\\Users\\PUBLIC\\Documents\\GridSwCert.txt',
      props.gridSwCertUrl,
    ),
    // Command to download, extract, configure, install, register, and increase performance* of latest NVIDIA drivers.
    //* 9-Disable-ECC-Checking(https://aws.amazon.com/blogs/media/virtual-prototyping-with-autodesk-vred-on-aws)
    // [g4dn] nvidia-smi -ac 5001,1590
    // [g5] nvidia-smi -ac 6250,1710
    ec2.InitCommand.shellCommand(
      "powershell.exe -Command \"$InstallationFilesFolder = 'C:\\Users\\Administrator\\Desktop\\InstallationFiles'; $Bucket = 'nvidia-gaming'; $KeyPrefix = 'windows/latest'; $Objects = Get-S3Object -BucketName $Bucket -KeyPrefix $KeyPrefix -Region us-east-1; foreach ($Object in $Objects) { $LocalFileName = $Object.Key; if ($LocalFileName -ne '' -and $Object.Size -ne 0) { $LocalFilePath = Join-Path $InstallationFilesFolder\\1_NVIDIA_drivers $LocalFileName; Copy-S3Object -BucketName $Bucket -Key $Object.Key -LocalFile $LocalFilePath -Region us-east-1 } }\"",
      {
        key: '5-Download-NVIDIA-Drivers',
        waitAfterCompletion: ec2.InitCommandWaitDuration.of(
          cdk.Duration.seconds(0),
        ),
      },
    ),
    ec2.InitCommand.shellCommand(
      "powershell.exe -Command \"$InstallationFilesFolder = 'C:\\Users\\Administrator\\Desktop\\InstallationFiles'; $extractFolder = \\\"$InstallationFilesFolder\\1_NVIDIA_drivers\\windows\\latest\\\"; $filesToExtract = 'Display.Driver HDAudio NVI2 PhysX EULA.txt ListDevices.txt setup.cfg setup.exe'; $Bucket = 'nvidia-gaming';  $KeyPrefix = 'windows/latest'; $Objects = Get-S3Object -BucketName $Bucket -KeyPrefix $KeyPrefix -Region us-east-1; foreach ($Object in $Objects) { $LocalFileName = $Object.Key; if ($LocalFileName -ne '' -and $Object.Size -ne 0) { $LocalFilePath = Join-Path $InstallationFilesFolder\\1_NVIDIA_drivers $LocalFileName }}; Start-Process -FilePath 'C:\\Program Files\\7-Zip\\7z.exe' -NoNewWindow -ArgumentList \\\"x -bso0 -bsp1 -bse1 -aoa $LocalFilePath $filesToExtract -o\\\"\\\"$extractFolder\\\"\\\"\\\" -wait; \"",
      {
        key: '6-Extract-NVIDIA-drivers',
        waitAfterCompletion: ec2.InitCommandWaitDuration.of(
          cdk.Duration.seconds(0),
        ),
      },
    ),
    ec2.InitCommand.shellCommand(
      'Powershell (Get-Content "C:\\Users\\Administrator\\Desktop\\InstallationFiles\\1_NVIDIA_drivers\\windows\\latest\\setup.cfg") | powershell Where-Object { $_ -notmatch \'name="${{(EulaHtmlFile|FunctionalConsentFile|PrivacyPolicyFile)}}\' } | Set-Content "C:\\Users\\Administrator\\Desktop\\InstallationFiles\\1_NVIDIA_drivers\\windows\\latest\\setup.cfg" -Encoding UTF8 -Force',
      {
        key: '7-Create-NVIDIA-driver-Installer',
        waitAfterCompletion: ec2.InitCommandWaitDuration.of(
          cdk.Duration.seconds(0),
        ),
      },
    ),
    ec2.InitCommand.shellCommand(
      "Powershell.exe -Command \"$install_args = '-passive -noreboot -noeula -nofinish -s'; Start-Process -FilePath 'C:\\Users\\Administrator\\Desktop\\InstallationFiles\\1_NVIDIA_drivers\\windows\\latest\\setup.exe' -ArgumentList $install_args -wait;\"",
      {
        key: '8-Install-NVIDIA-drivers',
        waitAfterCompletion: ec2.InitCommandWaitDuration.of(
          cdk.Duration.seconds(0),
        ),
      },
    ),
    ec2.InitCommand.shellCommand(
      'Powershell.exe -Command "C:\\Windows\\System32\\DriverStore\\FileRepository\\nvg*\\nvidia-smi.exe -e 0"',
      {
        key: '9-Disable-ECC-Checking',
        waitAfterCompletion: ec2.InitCommandWaitDuration.of(
          cdk.Duration.seconds(0),
        ),
      },
    ),
    ec2.InitCommand.shellCommand(
      'Powershell.exe -Command "C:\\Windows\\System32\\DriverStore\\FileRepository\\nvg*\\nvidia-smi.exe -ac 6250,1710"',
      {
        key: '910-Clock-Speed',
        waitAfterCompletion: ec2.InitCommandWaitDuration.of(
          cdk.Duration.seconds(0),
        ),
      },
    ),
    // ec2.InitCommand.shellCommand('Powershell.exe -Command "C:\\Windows\\System32\\DriverStore\\FileRepository\\nvg*\\nvidia-smi.exe -ac 5001,1590"', { key: '910-Clock-Speed', waitAfterCompletion: ec2.InitCommandWaitDuration.of(cdk.Duration.seconds(0)) }),
  ]);

  const nvidiadcv = new ec2.InitConfig([
    // Install NiceDCV #needs to updated with latest version in "cloud-gaming-on-ec2.ts" if a later version is released.
    // https://docs.aws.amazon.com/dcv/latest/adminguide/config-param-ref.html - target-fps = 0
    ec2.InitPackage.msi(props.niceDCVServerUrl, {
      key: '3-Install-NICEDCV-Server',
    }),
    ec2.InitPackage.msi(props.niceDCVDisplayDriverUrl, {
      key: '4-Install-NICEDCV-Display',
    }),
    ec2.InitCommand.shellCommand(
      'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Services\\nvlddmkm\\Global" /v vGamingMarketplace /t REG_DWORD /d 2',
      {
        key: '9-Add-Reg',
        waitAfterCompletion: ec2.InitCommandWaitDuration.of(
          cdk.Duration.seconds(0),
        ),
      },
    ),
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
      'reg add "HKEY_USERS\\S-1-5-18\\Software\\GSettings\\com\\nicesoftware\\dcv\\session-management\\automatic-console-session" /v owner /t REG_SZ /d Administrator /f',
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

  return { nvidia, nvidiadcv };
}

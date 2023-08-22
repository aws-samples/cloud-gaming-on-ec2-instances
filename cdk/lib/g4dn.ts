import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { BaseConfig, BaseEc2Stack } from './base';

export interface G4DNConfig extends BaseConfig {
    gridSwCertUrl: string;
}

export class G4DNStack extends BaseEc2Stack {
  protected props: G4DNConfig;

  constructor(scope: Construct, id: string, props: G4DNConfig) {
    super(scope, id, props);
  }

  protected getInstanceType() {
    return ec2.InstanceType.of(ec2.InstanceClass.G4DN, this.props.instanceSize);
  }

  protected getMachineImage() {
    return ec2.MachineImage.latestWindows(ec2.WindowsVersion.WINDOWS_SERVER_2022_ENGLISH_FULL_BASE);
  }

  protected getGpuType(): string {
    return 'NVIDIA';
  }
}

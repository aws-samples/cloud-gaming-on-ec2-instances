import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { BaseConfig, BaseEc2Stack } from './base';

export interface G4ADConfig extends BaseConfig {

}

export class G4ADStack extends BaseEc2Stack {
  protected props: G4ADConfig;

  constructor(scope: Construct, id: string, props: G4ADConfig) {
    super(scope, id, props);
  }

  protected getInstanceType() {
    return ec2.InstanceType.of(ec2.InstanceClass.G4AD, this.props.instanceSize);
  }

  protected getMachineImage() {
    return ec2.MachineImage.latestWindows(ec2.WindowsVersion.WINDOWS_SERVER_2022_ENGLISH_FULL_BASE);
}

  protected getGpuType(): string {
    return 'AMD';
  }
}

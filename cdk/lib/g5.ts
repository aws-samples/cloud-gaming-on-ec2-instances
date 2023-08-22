import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { BaseConfig, BaseEc2Stack } from './base';

export interface G5Config extends BaseConfig {
    gridSwCertUrl: string;
}

export class G5Stack extends BaseEc2Stack {
  protected props: G5Config;

  constructor(scope: Construct, id: string, props: G5Config) {
    super(scope, id, props);
  }

  protected getInstanceType() {
    return ec2.InstanceType.of(ec2.InstanceClass.G5, this.props.instanceSize);
  }

  protected getMachineImage() {
    return ec2.MachineImage.latestWindows(ec2.WindowsVersion.WINDOWS_SERVER_2022_ENGLISH_FULL_BASE);
}

  protected getGpuType(): string {
    return 'NVIDIA';
  }
}

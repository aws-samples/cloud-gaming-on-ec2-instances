import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { BaseConfig, BaseEc2Stack } from './base';

export interface G6Config extends BaseConfig {
    gridSwCertUrl: string;
}

export class G6Stack extends BaseEc2Stack {
  protected props: G6Config;

  constructor(scope: Construct, id: string, props: G6Config) {
    super(scope, id, props);
  }

  protected getInstanceType() {
    return ec2.InstanceType.of(ec2.InstanceClass.G6, this.props.instanceSize);
  }

  protected getMachineImage() {
//    return ec2.MachineImage.latestWindows(ec2.WindowsVersion.WINDOWS_SERVER_2022_ENGLISH_FULL_BASE);
    return ec2.MachineImage.latestWindows(ec2.WindowsVersion.WINDOWS_SERVER_2025_ENGLISH_FULL_BASE);
  }

  protected getGpuType(): string {
    return 'NVIDIA';
  }
}

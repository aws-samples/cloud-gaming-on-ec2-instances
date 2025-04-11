import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { BaseConfig, BaseEc2Stack } from './base';

export interface GR6Config extends BaseConfig {
    gridSwCertUrl: string;
}

export class GR6Stack extends BaseEc2Stack {
  protected props: GR6Config;

  constructor(scope: Construct, id: string, props: GR6Config) {
    super(scope, id, props);
  }

  protected getInstanceType() {
    return ec2.InstanceType.of(ec2.InstanceClass.GR6, this.props.instanceSize);
  }

  protected getMachineImage() {
//    return ec2.MachineImage.latestWindows(ec2.WindowsVersion.WINDOWS_SERVER_2022_ENGLISH_FULL_BASE);
    return ec2.MachineImage.latestWindows(ec2.WindowsVersion.WINDOWS_SERVER_2025_ENGLISH_FULL_BASE);
}

  protected getGpuType(): string {
    return 'NVIDIA';
  }
}

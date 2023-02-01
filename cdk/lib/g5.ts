import { InstanceType } from 'aws-cdk-lib/aws-ec2';
import { G4DNStack } from './g4dn';

export class G5Stack extends G4DNStack {
  protected getInstanceType() {
    return new InstanceType(`g5.${this.props.instanceSize}`);
  }
}

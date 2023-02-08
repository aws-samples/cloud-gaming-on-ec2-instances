import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from "constructs";
import { BaseConfig, BaseEc2Stack } from "./base";

export interface G4ADConfig extends BaseConfig {

}

export class G4ADStack extends BaseEc2Stack {
    protected props: G4ADConfig;

    constructor(scope: Construct, id: string, props: G4ADConfig) {
        super(scope, id, props);
    }

    protected getInstanceType() { 
        return new ec2.InstanceType(`g4ad.${this.props.instanceSize}`);
    }
}

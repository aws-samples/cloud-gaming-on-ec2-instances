import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { G4DNStack } from '../lib/g4dn';
import { G4ADStack } from '../lib/g4ad';

const app = new cdk.App();

const NICE_DCV_DISPLAY_DRIVER_URL = 'https://d1uj6qtbmh3dt5.cloudfront.net/Drivers/nice-dcv-virtual-display-x64-Release-34.msi';
const NICE_DCV_SERVER_URL = 'https://d1uj6qtbmh3dt5.cloudfront.net/2021.0/Servers/nice-dcv-server-x64-Release-2021.0-10242.msi';
const GRID_SW_CERT_URL = 'https://nvidia-gaming.s3.amazonaws.com/GridSwCert-Archive/GridSwCertWindows_2021_10_2.cert';

const SSH_KEY_NAME = 'GamingOnEc2';
const VOLUME_SIZE_GIB = 300;
const OPEN_PORTS = [3389, 8443];
const ALLOW_INBOUND_CIDR = '0.0.0.0/0';
const ACCOUNT_ID = 'CHANGE_ME';
const REGION = 'eu-west-1';

new G4DNStack(app, 'CloudGamingOnG4DN', {
  niceDCVDisplayDriverUrl: NICE_DCV_DISPLAY_DRIVER_URL,
  niceDCVServerUrl: NICE_DCV_SERVER_URL,
  gridSwCertUrl: GRID_SW_CERT_URL,
  instanceSize: ec2.InstanceSize.XLARGE,
  sshKeyName: SSH_KEY_NAME,
  volumeSizeGiB: VOLUME_SIZE_GIB,
  openPorts: OPEN_PORTS,
  associateElasticIp: true,
  allowInboundCidr: ALLOW_INBOUND_CIDR,
  env: {
    account: ACCOUNT_ID,
    region: REGION,
  },
  tags: {
    project: 'CloudGamingG4DN',
  },
});

new G4DNStack(app, 'CloudGamingOnG4DN-2xlarge', {
  niceDCVDisplayDriverUrl: NICE_DCV_DISPLAY_DRIVER_URL,
  niceDCVServerUrl: NICE_DCV_SERVER_URL,
  gridSwCertUrl: GRID_SW_CERT_URL,
  instanceSize: ec2.InstanceSize.XLARGE2,
  sshKeyName: SSH_KEY_NAME,
  volumeSizeGiB: VOLUME_SIZE_GIB,
  openPorts: OPEN_PORTS,
  associateElasticIp: true,
  allowInboundCidr: ALLOW_INBOUND_CIDR,
  env: {
    account: ACCOUNT_ID,
    region: REGION,
  },
  tags: {
    project: 'CloudGamingG4DN',
  },
});

new G4ADStack(app, 'CloudGamingOnG4AD', {
  niceDCVDisplayDriverUrl: NICE_DCV_DISPLAY_DRIVER_URL,
  niceDCVServerUrl: NICE_DCV_SERVER_URL,
  instanceSize: ec2.InstanceSize.XLARGE4,
  sshKeyName: SSH_KEY_NAME,
  volumeSizeGiB: VOLUME_SIZE_GIB,
  openPorts: OPEN_PORTS,
  associateElasticIp: true,
  allowInboundCidr: ALLOW_INBOUND_CIDR,
  env: {
    account: ACCOUNT_ID,
    region: REGION,
  },
  tags: {
    project: 'CloudGamingG4AD',
  },
});

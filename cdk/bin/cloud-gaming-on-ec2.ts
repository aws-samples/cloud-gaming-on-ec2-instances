import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as cdk from 'aws-cdk-lib';
import 'source-map-support/register';
import { G4DNStack } from '../lib/g4dn';
import { G4ADStack } from '../lib/g4ad';
import { G5Stack } from '../lib/g5';
import { G6Stack } from '../lib/g6';
import { G6EStack } from '../lib/g6e';
import { GR6Stack } from '../lib/gr6';



const app = new cdk.App();

const NICE_DCV_DISPLAY_DRIVER_URL = 'https://d1uj6qtbmh3dt5.cloudfront.net/nice-dcv-virtual-display-x64-Release.msi';
const NICE_DCV_SERVER_URL = 'https://d1uj6qtbmh3dt5.cloudfront.net/nice-dcv-server-x64-Release.msi';
//const NICE_DCV_SERVER_URL = 'https://d1uj6qtbmh3dt5.cloudfront.net/2023.0/Servers/nice-dcv-server-x64-Release-2023.0-15487.msi';              
//const GRID_SW_CERT_URL = 'https://nvidia-gaming.s3.amazonaws.com/GridSwCert-Archive/GridSwCertWindows_2021_10_2.cert';
const GRID_SW_CERT_URL = 'https://nvidia-gaming.s3.amazonaws.com/GridSwCert-Archive/GridSwCertWindows_2024_02_22.cert';
const CHROME_URL = 'https://dl.google.com/tag/s/appname=Google%20Chrome&needsadmin=true&ap=x64-stable-statsdef_0&brand=GCEA/dl/chrome/install/googlechromestandaloneenterprise64.msi';
//const SEVEN_ZIP_URL = 'https://www.7-zip.org/a/7z2201-x64.msi';
const SEVEN_ZIP_URL = 'https://7-zip.org/a/7z2409-x64.msi';



const EC2_KEYPAIR_NAME = 'N.Virginia';
const VOLUME_SIZE_GIB = 200;
const OPEN_PORTS = [8443];
const ALLOW_INBOUND_CIDR = '0.0.0.0/0';
const ACCOUNT_ID = '844633438632';
const REGION = 'us-east-1';

new G4DNStack(app, 'CloudGamingsOnG4DN', {
  niceDCVDisplayDriverUrl: NICE_DCV_DISPLAY_DRIVER_URL,
  niceDCVServerUrl: NICE_DCV_SERVER_URL,
  sevenZipUrl: SEVEN_ZIP_URL,
  chromeUrl: CHROME_URL,
  gridSwCertUrl: GRID_SW_CERT_URL,
  instanceSize: ec2.InstanceSize.XLARGE,
  ec2KeyName: EC2_KEYPAIR_NAME,
  volumeSizeGiB: VOLUME_SIZE_GIB,
  openPorts: OPEN_PORTS,
  associateElasticIp: true,
  allowInboundCidr: ALLOW_INBOUND_CIDR,
  env: {
    account: ACCOUNT_ID,
    region: REGION,
  },
  tags: {
    project: 'CloudGamingOnG4DN',
  },
});

new G5Stack(app, 'CloudGamingOnG5', {
  niceDCVDisplayDriverUrl: NICE_DCV_DISPLAY_DRIVER_URL,
  niceDCVServerUrl: NICE_DCV_SERVER_URL,
  sevenZipUrl: SEVEN_ZIP_URL,
  chromeUrl: CHROME_URL,
  gridSwCertUrl: GRID_SW_CERT_URL,
  instanceSize: ec2.InstanceSize.XLARGE,
  ec2KeyName: EC2_KEYPAIR_NAME,
  volumeSizeGiB: VOLUME_SIZE_GIB,
  openPorts: OPEN_PORTS,
  associateElasticIp: true,
  allowInboundCidr: ALLOW_INBOUND_CIDR,
  env: {
    account: ACCOUNT_ID,
    region: REGION,
  },
  tags: {
    project: 'CloudGamingsOnG5',
  },
});

new G6Stack(app, 'CloudGamingOnG6', {
  niceDCVDisplayDriverUrl: NICE_DCV_DISPLAY_DRIVER_URL,
  niceDCVServerUrl: NICE_DCV_SERVER_URL,
  sevenZipUrl: SEVEN_ZIP_URL,
  chromeUrl: CHROME_URL,
  gridSwCertUrl: GRID_SW_CERT_URL,
  instanceSize: ec2.InstanceSize.XLARGE,
  ec2KeyName: EC2_KEYPAIR_NAME,
  volumeSizeGiB: VOLUME_SIZE_GIB,
  openPorts: OPEN_PORTS,
  associateElasticIp: true,
  allowInboundCidr: ALLOW_INBOUND_CIDR,
  env: {
    account: ACCOUNT_ID,
    region: REGION,
  },
  tags: {
    project: 'CloudGamingsOnG6',
  },
});

new G6EStack(app, 'CloudGamingOnG6E', {
  niceDCVDisplayDriverUrl: NICE_DCV_DISPLAY_DRIVER_URL,
  niceDCVServerUrl: NICE_DCV_SERVER_URL,
  sevenZipUrl: SEVEN_ZIP_URL,
  chromeUrl: CHROME_URL,
  gridSwCertUrl: GRID_SW_CERT_URL,
  instanceSize: ec2.InstanceSize.XLARGE,
  ec2KeyName: EC2_KEYPAIR_NAME,
  volumeSizeGiB: VOLUME_SIZE_GIB,
  openPorts: OPEN_PORTS,
  associateElasticIp: true,
  allowInboundCidr: ALLOW_INBOUND_CIDR,
  env: {
    account: ACCOUNT_ID,
    region: REGION,
  },
  tags: {
    project: 'CloudGamingsOnG6E',
  },
});

new GR6Stack(app, 'CloudGamingOnGR6', {
  niceDCVDisplayDriverUrl: NICE_DCV_DISPLAY_DRIVER_URL,
  niceDCVServerUrl: NICE_DCV_SERVER_URL,
  sevenZipUrl: SEVEN_ZIP_URL,
  chromeUrl: CHROME_URL,
  gridSwCertUrl: GRID_SW_CERT_URL,
  instanceSize: ec2.InstanceSize.XLARGE4, // Minimum size
  ec2KeyName: EC2_KEYPAIR_NAME,
  volumeSizeGiB: VOLUME_SIZE_GIB,
  openPorts: OPEN_PORTS,
  associateElasticIp: true,
  allowInboundCidr: ALLOW_INBOUND_CIDR,
  env: {
    account: ACCOUNT_ID,
    region: REGION,
  },
  tags: {
    project: 'CloudGamingsOnGR6',
  },
});


new G4ADStack(app, 'CloudGamingsOnG4AD', {
  niceDCVDisplayDriverUrl: NICE_DCV_DISPLAY_DRIVER_URL,
  niceDCVServerUrl: NICE_DCV_SERVER_URL,
  chromeUrl: CHROME_URL,
  sevenZipUrl: SEVEN_ZIP_URL,
  gridSwCertUrl: GRID_SW_CERT_URL,
  instanceSize: ec2.InstanceSize.XLARGE,
  ec2KeyName: EC2_KEYPAIR_NAME,
  volumeSizeGiB: VOLUME_SIZE_GIB,
  openPorts: OPEN_PORTS,
  associateElasticIp: true,
  allowInboundCidr: ALLOW_INBOUND_CIDR,
  env: {
    account: ACCOUNT_ID,
    region: REGION,
  },
  tags: {
    project: 'CloudGamingsOnG4AD',
  },
});

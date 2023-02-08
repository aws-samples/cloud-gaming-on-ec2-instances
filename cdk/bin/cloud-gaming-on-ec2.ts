import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as cdk from "aws-cdk-lib";
import "source-map-support/register";
import { G4DNStack } from "../lib/g4dn";
import { G4ADStack } from "../lib/g4ad";
import { G5Stack } from "../lib/g5";


const app = new cdk.App();

const NICE_DCV_DISPLAY_DRIVER_URL = "https://d1uj6qtbmh3dt5.cloudfront.net/nice-dcv-virtual-display-x64-Release.msi";
const NICE_DCV_SERVER_URL = "https://d1uj6qtbmh3dt5.cloudfront.net/nice-dcv-server-x64-Release.msi";
const GRID_SW_CERT_URL = "https://nvidia-gaming.s3.amazonaws.com/GridSwCert-Archive/GridSwCertWindows_2021_10_2.cert";
const CHROME_URL = "https://dl.google.com/tag/s/appname=Google%20Chrome&needsadmin=true&ap=x64-stable-statsdef_0&brand=GCEA/dl/chrome/install/googlechromestandaloneenterprise64.msi";
const SEVEN_URL = "https://www.7-zip.org/a/7z2201-x64.msi";


const SSH_KEY_NAME = "CHANGE_ME";
const VOLUME_SIZE_GIB = 200;
const OPEN_PORTS = [3389, 8443];
const ALLOW_INBOUND_CIDR = "0.0.0.0/0";
const ACCOUNT_ID = "CHANGE_ME";
const REGION = "eu-west-1";

new G4DNStack(app, "CloudGraphicsOnG4DN", {
    niceDCVDisplayDriverUrl: NICE_DCV_DISPLAY_DRIVER_URL,
    niceDCVServerUrl: NICE_DCV_SERVER_URL,
    sevenzip: SEVEN_URL,
    chromeUrl: CHROME_URL,
    gpu: "NVIDIA",
    gridSwCertUrl: GRID_SW_CERT_URL,
    instanceSize: ec2.InstanceSize.XLARGE,
    sshKeyName: SSH_KEY_NAME,
    volumeSizeGiB: VOLUME_SIZE_GIB,
    openPorts: OPEN_PORTS,
    associateElasticIp: true,
    allowInboundCidr: ALLOW_INBOUND_CIDR,
    env: {
        account: ACCOUNT_ID,
        region: REGION
    },
    tags: {
        "project": "CloudGraphicsG4DN"
    }
});

new G5Stack(app, "CloudGraphicsOnG5", {
    niceDCVDisplayDriverUrl: NICE_DCV_DISPLAY_DRIVER_URL,
    niceDCVServerUrl: NICE_DCV_SERVER_URL,
    sevenzip: SEVEN_URL,
    chromeUrl: CHROME_URL,
    gpu: "NVIDIA",
    gridSwCertUrl: GRID_SW_CERT_URL,
    instanceSize: ec2.InstanceSize.XLARGE,
    sshKeyName: SSH_KEY_NAME,
    volumeSizeGiB: VOLUME_SIZE_GIB,
    openPorts: OPEN_PORTS,
    associateElasticIp: true,
    allowInboundCidr: ALLOW_INBOUND_CIDR,
    env: {
        account: ACCOUNT_ID,
        region: REGION
    },
    tags: {
        "project": "CloudGraphicsOnG5"
    }
});

new G4ADStack(app, "CloudGraphicsOnG4AD", {
    niceDCVDisplayDriverUrl: NICE_DCV_DISPLAY_DRIVER_URL,
    niceDCVServerUrl: NICE_DCV_SERVER_URL,
    chromeUrl: CHROME_URL,
    gpu: "AMD",
    sevenzip: SEVEN_URL,
    gridSwCertUrl: GRID_SW_CERT_URL,
    instanceSize: ec2.InstanceSize.XLARGE,
    sshKeyName: SSH_KEY_NAME,
    volumeSizeGiB: VOLUME_SIZE_GIB,
    openPorts: OPEN_PORTS,
    associateElasticIp: true,
    allowInboundCidr: ALLOW_INBOUND_CIDR,
    env: {
        account: ACCOUNT_ID,
        region: REGION
    },
    tags: {
        "project": "CloudGraphicsG4AD"
    }
});

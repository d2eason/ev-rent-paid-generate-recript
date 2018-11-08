var AWS = require("aws-sdk");
var moment = require('moment');
var PDFDocument = require('pdfkit');



exports.handler = (event) => {
    var s3 = new AWS.S3();
    var sns = event.Records[0].Sns;
    var eventBody = JSON.parse(sns.Message);

    //format document
    var doc = new PDFDocument();

    doc.fontSize(24)
        .text("Rent Receipt")
        .moveDown(0.5);
    
    //doc.font('fonts/PalatinoBold.ttf')
    //.fontSize(24)
    doc.fontSize(18)
    .text(eventBody.Amount)
    .moveDown(0.5);
    
    doc.text(eventBody.Property);
    
    doc.end();
    
    var params = {
        Key : eventBody.Property + "_" + moment(sns.Timestamp).format('YYYYMMDDHHmmss') + ".pdf",
        Body: doc,
        Bucket: 'ev-rental-receipts',
        ContentType : 'application/pdf'
    };
    
    //write to s3 bucket
    s3.upload(params, function(err, response){
        console.log(err);
    });
    
    
    //place message on queue for printer
    var sqs = new AWS.SQS();
    var qMsg = {
        Key: eventBody.Property + "_" + moment(sns.Timestamp).format('YYYYMMDDHHmmss') + ".pdf",
        Bucket: 'ev-rental-receipts',
        ContentType : 'application/pdf' 
    };
    
    var sqsParams = {
        MessageBody: JSON.stringify(qMsg),
        QueueUrl: 'https://sqs.us-east-1.amazonaws.com/330771229214/ev-print-paid-rent-receipt'
    };
    
    sqs.sendMessage(sqsParams, function(err, response){
        if(err) console.log(err);
    })
    
    
};

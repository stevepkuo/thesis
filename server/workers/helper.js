const config = require('config')['mailgun'];
const nodemailer = require('nodemailer');
const Promise = require('bluebird');

exports.generateHTMLfromSemicolon = function(messages) {
  var allLines = messages.split(';');
  var html = '';
  allLines.forEach(eachLine => {
    if (eachLine.includes(`<a href> `)) {
      eachLine = eachLine.replace('<a href> ', '');
      html += `<a href="${eachLine}">${eachLine}</a>`;
    } else {
      html += `<div>${eachLine}</div>`;
    }
  });
  return html;
};

exports.sendMail = function (toEmail, message) {

  var transporter;

  transporter = nodemailer.createTransport({
    service: 'Mailgun',
    auth: {
      user: config.postmaster,
      pass: config.domainpassword
    }
  });
  emailmessage = {
    from: `Mailgun Sandbox <${config.postmaster}>`, //YourServer
    to: toEmail, // comma separated list
    subject: 'From your friendly Otter',
    text: message,
    html: exports.generateHTMLfromSemicolon(message)
  };
  console.log(emailmessage);
  return new Promise(function(res, rej) {
    transporter.sendMail(emailmessage, function(error, info) {
      if (error) {
        console.log(error);
        console.log('Didnt send: ', error);
        rej(error);
      } else {
        console.log('Sent: ' + info.response);
        res(info);
      }
    });
  });
};

exports.extractInviteIDs = (usersAndTheirInvites) => {
  var inviteIDs = [];
  usersAndTheirInvites.forEach(eachUser => {
    eachUser.invitedToBoards.forEach(eachInviteBoard => {
      console.log(eachInviteBoard);
      inviteIDs.push(eachInviteBoard._pivot_id);
    });
  });
  return inviteIDs;
};

//This is to notify existing members that they were added to boards
exports.composeEmails = function(usersAndTheirInvites) {
  var emails = [];
  usersAndTheirInvites.forEach(eachUser => {
    var eachUserEmailMessage = 'You have been added to the following Otter boards...;';
    eachUser.invitedToBoards.forEach(eachInviteBoard => {
      eachUserEmailMessage += `;board_name: ${eachInviteBoard.board_name};`;
      eachUserEmailMessage += `repo_url: ${eachInviteBoard.repo_url};`;
    });
    emails.push(eachUserEmailMessage);
  });
  return emails;
};

//This is the notify non-members that they were invited to boards
exports.composeInvites = function(usersAndTheirInvites) {
  var emails = [];
  usersAndTheirInvites.forEach(eachUser => {
    var eachUserEmailMessage = 'You have been invited to the following Otter boards...;';
    eachUserEmailMessage += 'Sign up and add these boards by clicking the following link;';
    eachUserEmailMessage += `;<a href> http://localhost:3000/signup/${eachUser.api_key};`;
    eachUser.invitedToBoards.forEach(eachInviteBoard => {
      eachUserEmailMessage += `;board_name: ${eachInviteBoard.board_name};`;
      eachUserEmailMessage += `repo_url: ${eachInviteBoard.repo_url};`;
    });
    emails.push(eachUserEmailMessage);
  });
  return emails;
};
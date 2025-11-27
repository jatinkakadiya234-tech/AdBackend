// models/SupportTicket.js
const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema({
  // ===== Ticket Identification =====
  ticketId: { 
    type: String, 
    unique: true, 
    required: true 
  }, // Auto-generated: TICKET-2024-001234
  
  // ===== User Information =====
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  userRole: {
    type: String,
    enum: ['viewer', 'publisher', 'admin'],
    required: true
  },
  
  // ===== Ticket Details =====
  subject: { 
    type: String, 
    required: true,
    maxlength: 200 
  },
  
  category: {
    type: String,
    enum: [
      'technical_issue',
      'billing_payment',
      'account_access',
      'kyc_verification',
      'platform_verification',
      'campaign_issue',
      'ad_performance',
      'integration_help',
      'feature_request',
      'bug_report',
      'general_inquiry',
      'other'
    ],
    required: true
  },
  
  status: {
    type: String,
    enum: ['open', 'in_progress', 'waiting_on_customer', 'waiting_on_agent', 'resolved', 'closed', 'reopened'],
    default: 'open'
  },
  
  // ===== Messages/Conversation =====
  messages: [{
    messageId: String,
    sender: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    },
    senderType: {
      type: String,
      enum: ['user', 'agent', 'system']
    },
    content: { 
      type: String, 
      required: true 
    },
    attachments: [{
      fileName: String,
      fileUrl: String,
      fileType: String,
      fileSize: Number,
      uploadedAt: { type: Date, default: Date.now }
    }],

    // readBy: [{
    //   userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    //   readAt: Date
    // }]
  }],
  
  // ===== Assignment =====
//   assignedTo: { 
//     type: mongoose.Schema.Types.ObjectId, 
//     ref: 'User' // Admin/Support agent
//   },
//   assignedAt: Date,
//   department: {
//     type: String,
//     enum: ['technical', 'billing', 'customer_success', 'compliance', 'general']
//   },
  
  // ===== Resolution =====
//   resolution: {
//     resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
//     resolvedAt: Date,
//     resolutionNotes: String,
//     resolutionType: {
//       type: String,
//       enum: ['fixed', 'workaround', 'explained', 'not_reproducible', 'wont_fix', 'duplicate']
//     }
//   },
  
  // ===== SLA Tracking =====
//   sla: {
//     responseTime: Number, // Minutes to first response
//     resolutionTime: Number, // Minutes to resolution
//     responseDeadline: Date,
//     resolutionDeadline: Date,
//     breached: { type: Boolean, default: false }
//   },
  
  // ===== Customer Satisfaction =====
  feedback: {
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
    submittedAt: Date
  },
  

  // ===== Timestamps =====
  lastActivityAt: { type: Date, default: Date.now },
  closedAt: Date
}, {
  timestamps: true
});

// ===== INDEXES =====
supportTicketSchema.index({ ticketId: 1 });
supportTicketSchema.index({ userId: 1, status: 1 });
supportTicketSchema.index({ assignedTo: 1, status: 1 });
supportTicketSchema.index({ category: 1, priority: 1 });
supportTicketSchema.index({ createdAt: -1 });

// ===== PRE-SAVE HOOKS =====
supportTicketSchema.pre('save', async function(next) {
  // Auto-generate ticket ID
  if (this.isNew && !this.ticketId) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments();
    this.ticketId = `TICKET-${year}-${String(count + 1).padStart(6, '0')}`;
  }
  
  // Update lastActivityAt
  this.lastActivityAt = new Date();
  
  next();
});

// ===== METHODS =====
supportTicketSchema.methods.addMessage = async function(senderId, content, attachments = [], isInternal = false) {
  this.messages.push({
    messageId: `MSG-${Date.now()}`,
    sender: senderId,
    content,
    attachments,
    isInternal,
    timestamp: new Date()
  });
  this.lastActivityAt = new Date();
  await this.save();
};

// supportTicketSchema.methods.assignTo = async function(agentId, department) {
//   this.assignedTo = agentId;
//   this.department = department;
//   this.assignedAt = new Date();
//   this.status = 'in_progress';
//   await this.save();
// };

supportTicketSchema.methods.resolve = async function(agentId, notes, resolutionType) {
  this.status = 'resolved';
  this.resolution = {
    resolvedBy: agentId,
    resolvedAt: new Date(),
    resolutionNotes: notes,
    resolutionType
  };
  await this.save();
};

module.exports = mongoose.model('SupportTicket', supportTicketSchema);

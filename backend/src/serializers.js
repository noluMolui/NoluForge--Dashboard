const { toUiStatus } = require('./statusMap')

function serializeEvent(event) {
  return {
    id: event.id,
    type: event.eventType,
    text: event.message,
    timestamp: event.createdAt,
    metadata: event.metadata || null,
  }
}

function serializeProject(project) {
  return {
    id: project.id,
    businessName: project.businessName,
    contactInfo: project.contactInfo,
    projectType: project.projectType,
    previewLink: project.previewLink,
    status: toUiStatus(project.status),
    quoteAmount: project.quoteAmount,
    amountPaid: project.amountPaid,
    progress: project.progress,
    depositPercent: project.depositPercent,
    lastOutreach: project.lastOutreach ? project.lastOutreach.toISOString().slice(0, 10) : null,
    activity: (project.events || []).map(serializeEvent),
    payments: (project.payments || []).map((payment) => ({
      id: payment.id,
      kind: payment.kind,
      amount: payment.amount,
      paidAt: payment.paidAt,
      reference: payment.reference,
    })),
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  }
}

module.exports = {
  serializeProject,
  serializeEvent,
}

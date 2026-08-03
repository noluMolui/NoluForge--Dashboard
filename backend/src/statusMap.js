const STATUS_MAP = {
  'Concept / In Progress': 'CONCEPT_IN_PROGRESS',
  'Ready for Review': 'READY_FOR_REVIEW',
  'Awaiting Payment': 'AWAITING_PAYMENT',
  Paid: 'PAID',
}

const STATUS_LABEL = {
  CONCEPT_IN_PROGRESS: 'Concept / In Progress',
  READY_FOR_REVIEW: 'Ready for Review',
  AWAITING_PAYMENT: 'Awaiting Payment',
  PAID: 'Paid',
}

function toDbStatus(label) {
  return STATUS_MAP[label] || 'CONCEPT_IN_PROGRESS'
}

function toUiStatus(dbValue) {
  return STATUS_LABEL[dbValue] || 'Concept / In Progress'
}

module.exports = {
  toDbStatus,
  toUiStatus,
}

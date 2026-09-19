export type ProposalStatus = "proposed" | "agreed" | "rejected" | "superseded";

export interface UnitBreakdownItem {
  title: string;
  description?: string;
}

export interface ProposalRecord {
  id: string;
  conversationId: string;
  version: number;
  proposedBy: string; // userId
  scheduledStart: string; // ISO string
  scheduledEnd: string; // ISO string
  totalMinutes: number;
  location: string;
  agreedPriceAmount: number; // KRW
  learningGoal: string;
  unitBreakdown: UnitBreakdownItem[];
  agreedByLearner: boolean;
  agreedByTutor: boolean;
  status: ProposalStatus;
  createdAt: string;
}

export interface ChatMessageRecord {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: "learner" | "tutor" | "system";
  text: string;
  proposalId?: string;
  createdAt: string;
}

export interface ConversationRecord {
  id: string;
  courseId: string;
  learningRequestId?: string;
  tutorId: string;
  learnerId: string;
  currentProposalId?: string;
  currentVersion: number;
  status: "active" | "agreed" | "closed";
  createdAt: string;
  updatedAt: string;
}

export interface CreateConversationInput {
  courseId: string;
  learningRequestId?: string;
}

export interface CreateProposalInput {
  scheduledStart: string;
  scheduledEnd: string;
  location: string;
  agreedPriceAmount: number;
  totalMinutes?: number;
  learningGoal?: string;
  unitBreakdown?: UnitBreakdownItem[];
}

export interface SendMessageInput {
  text: string;
}

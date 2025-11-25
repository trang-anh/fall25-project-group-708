import { MatchProfile } from '@fake-stack-overflow/shared';

export type EditableMatchProfile = Omit<MatchProfile, '_id' | 'userId' | 'createdAt'>;

export interface ChatMessage {
  id: string;
  sender: 'user' | 'chef';
  text: string;
  timestamp: string;
}

export interface ChatHistory {
  [recipeId: string]: ChatMessage[];
}

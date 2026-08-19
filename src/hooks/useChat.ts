import { useApp } from '../context/AppContext';
import { chatService } from '../services/api';
import type { ChatMessage } from '../types/Chat';

export const useChat = (recipeId: string) => {
  const {
    chatHistory,
    setChatHistory,
    isChefTyping,
    setIsChefTyping,
    allRecipes,
  } = useApp();

  const messages = chatHistory[recipeId] || [];

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    // 1. Add User Message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const currentHistory = chatHistory[recipeId] || [];
    const updatedMessages = [...currentHistory, userMessage];

    setChatHistory(prev => ({
      ...prev,
      [recipeId]: updatedMessages,
    }));

    setIsChefTyping(true);

    try {
      // Find the recipe in the merged collection (mock + generated)
      const recipe = allRecipes.find(r => r.id === recipeId);
      if (!recipe) {
        throw new Error('Could not find the details of this recipe to discuss.');
      }

      // Map to shape expected by the Gemini chat route schema
      const payloadRecipe = {
        recipe_name: recipe.name,
        ingredients: recipe.ingredients.map(ing => ({
          name: ing.name,
          quantity: `${ing.amount}${ing.unit ? ' ' + ing.unit : ''}`,
        })),
        steps: recipe.steps.map(step => ({
          instruction: step.instruction,
        })),
      };

      // Map chat messages to expected Gemini history role names
      const historyPayload = currentHistory.map(msg => ({
        role: msg.sender === 'chef' ? 'model' as const : 'user' as const,
        text: msg.text,
      }));

      // Call API
      const result = await chatService.askChef({
        recipe: payloadRecipe,
        question: text.trim(),
        chat_history: historyPayload,
      });

      // Add Chef response message
      const chefMessage: ChatMessage = {
        id: `chef-${Date.now()}`,
        sender: 'chef',
        text: result.response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setChatHistory(prev => ({
        ...prev,
        [recipeId]: [...(prev[recipeId] || []), chefMessage],
      }));
    } catch (err: any) {
      const errMsg = err.message || 'Apologies, I hit a temporary communication issue with the kitchen. Please retry.';
      
      const errorChefMessage: ChatMessage = {
        id: `chef-err-${Date.now()}`,
        sender: 'chef',
        text: `🚫 ${errMsg}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setChatHistory(prev => ({
        ...prev,
        [recipeId]: [...(prev[recipeId] || []), errorChefMessage],
      }));
    } finally {
      setIsChefTyping(false);
    }
  };

  return {
    messages,
    sendMessage,
    isTyping: isChefTyping,
  };
};

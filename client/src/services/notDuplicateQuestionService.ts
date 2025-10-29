interface NotDuplicateQuestionData {
  questionTitle: string;
  questionText: string;
  similarQuestionIds: string[];
  justification: string;
  username: string;
}

interface SaveNotDuplicateQuestionResponse {
  success: boolean;
  error?: string;
  data?: any;
}

/**
 * Saves a "not duplicate question" justification to the backend
 * 
 * @param data - The not duplicate question data including justification
 * @returns Promise with success status and any error message
 */
export const saveNotDuplicateQuestion = async (
  data: NotDuplicateQuestionData
): Promise<SaveNotDuplicateQuestionResponse> => {
  try {
    // Note: Backend uses GET method with body (unusual but following existing implementation)
    const response = await fetch(
      'http://localhost:8000/notDuplicateQuestion/saveNotDuplicateQuestion',
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: errorText || 'Failed to save not duplicate question',
      };
    }

    const result = await response.json();
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('Error saving not duplicate question:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};
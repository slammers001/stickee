import { supabase } from '@/lib/supabase';
import { getUserId } from './userService';

export type IssueType = 'bug' | 'feature' | 'enhancement' | 'question' | 'other';

export interface Issue {
  id: string;
  title: string;
  description: string;
  type: IssueType;
  user_id: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
  updated_at: string;
}

// Check if issues table exists
export const checkIssuesTableExists = async () => {
  try {
    const { data, error } = await supabase
      .from('issues')
      .select('id')
      .limit(1);
    
    console.log('Table existence check:', { data, error });
    
    // Table exists if we get data (even empty array/object) and no error
    const tableExists = !error && data !== null;
    console.log('Table exists:', tableExists);
    return tableExists;
  } catch (err) {
    console.error('Error checking table existence:', err);
    return false;
  }
};

// Test function to check if we can access the issues table
export const testIssuesTable = async () => {
  try {
    const userId = await getUserId();
    
    if (!userId || typeof userId !== 'string') {
      throw new Error('Invalid or missing user id. Ensure user is authenticated.');
    }

    console.log('Testing issues table access for user:', userId);
    
    // Test if we can read from the table
    const { data: testData, error: testError } = await supabase
      .from('issues')
      .select('count')
      .eq('user_id', userId);
    
    console.log('Table test result:', { testData, testError });
    
    // Check if there's actually an error (not just empty object)
    const hasError = testError && (
      testError.message || 
      testError.details || 
      testError.code ||
      Object.keys(testError).length > 0
    );
    
    if (hasError) {
      console.error('Cannot access issues table:', testError);
      return false;
    }
    
    console.log('Issues table is accessible');
    return true;
  } catch (error) {
    console.error('Error testing issues table:', error);
    return false;
  }
};

// Create a new issue
export const createIssue = async (issueData: {
  title: string;
  description: string;
  type: IssueType;
}): Promise<Issue> => {
  try {
    const userId = await getUserId();
    
    console.log('Creating issue for user:', userId);
    
    if (!userId || typeof userId !== 'string') {
      throw new Error(`Invalid or missing user id. Got: ${userId} (type: ${typeof userId})`);
    }

    // Ensure user exists in public.users
    const { error: userCheckError } = await supabase
      .from('users')
      .upsert({
        id: userId,
        created_at: new Date().toISOString(),
        app_version: '1.0.0'
      }, {
        onConflict: 'id'
      });
    
    if (userCheckError) {
      console.error('Error ensuring user exists:', userCheckError);
      throw new Error(`Failed to ensure user exists: ${userCheckError.message}`);
    }
    
    const issueToCreate = {
      title: issueData.title.trim(),
      description: issueData.description.trim(),
      type: issueData.type,
      user_id: userId,
      status: 'open' as const,
    };

    console.log('Issue data to create:', issueToCreate);

    const { data, error } = await supabase
      .from('issues')
      .insert(issueToCreate)
      .select()
      .single();

    console.log('Insert result:', { data, error });

    if (error) {
      console.error('Supabase error creating issue:', {
        error,
        message: error.message,
        code: error.code,
        details: error.details,
        userId,
        issueData
      });
      throw new Error(`Failed to create issue: ${error.message}`);
    }

    if (!data) {
      throw new Error('No data returned from Supabase when creating issue');
    }

    console.log('Issue created successfully:', data);
    return data as Issue;
  } catch (error) {
    console.error('Error in createIssue:', error);
    throw error;
  }
};

// Get all issues for the current user
export const getIssues = async (): Promise<Issue[]> => {
  try {
    const userId = await getUserId();

    if (!userId || typeof userId !== 'string') {
      throw new Error('Invalid or missing user id. Ensure user is authenticated.');
    }

    const { data: issues, error } = await supabase
      .from('issues')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return issues || [];
  } catch (error) {
    console.error('Error fetching issues:', error);
    return [];
  }
};

// Update an issue status
export const updateIssueStatus = async (id: string, status: Issue['status']): Promise<Issue | null> => {
  try {
    const userId = await getUserId();

    if (!userId || typeof userId !== 'string') {
      throw new Error('Invalid or missing user id. Ensure user is authenticated.');
    }

    const { data, error } = await supabase
      .from('issues')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data as Issue;
  } catch (error) {
    console.error('Error updating issue status:', error);
    throw error;
  }
};

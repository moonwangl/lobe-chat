import { NextResponse } from 'next/server';

// Temporarily disable Edge runtime to bypass DOMParser issues
// This is a workaround until a proper fix can be implemented
export const runtime = 'nodejs';

// Return a simple response indicating the route is temporarily disabled
const handler = () => {
  return NextResponse.json({
    error: 'Edge runtime temporarily disabled due to DOMParser compatibility issues',
    message: 'Please use the Node.js API endpoint instead',
  });
};

export { handler as GET, handler as POST };

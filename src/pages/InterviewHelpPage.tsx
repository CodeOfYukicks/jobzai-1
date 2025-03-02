import React from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

export default function InterviewHelpPage() {
  return (
    <AuthLayout>
      <div className="max-w-6xl mx-auto p-4 sm:p-6 md:p-8">
        <h1 className="text-3xl font-bold mb-6">Interview Preparation Help</h1>
        
        <Tabs defaultValue="getting-started">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="getting-started">Getting Started</TabsTrigger>
            <TabsTrigger value="job-analysis">Job Posting Analysis</TabsTrigger>
            <TabsTrigger value="interview-prep">Interview Preparation</TabsTrigger>
          </TabsList>
          
          <TabsContent value="getting-started">
            <Card>
              <CardHeader>
                <CardTitle>Getting Started with JobZai Interview Prep</CardTitle>
                <CardDescription>
                  Learn how to use our interview preparation tools
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <section className="space-y-4">
                  <h2 className="text-xl font-semibold">Overview</h2>
                  <p>
                    JobZai's interview preparation features help you prepare for upcoming job interviews by:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Analyzing job postings to extract key requirements and responsibilities</li>
                    <li>Providing AI-generated practice questions tailored to the role</li>
                    <li>Offering example answers and talking points</li>
                    <li>Tracking and managing your upcoming interviews</li>
                  </ul>
                </section>
                
                <section className="space-y-4">
                  <h2 className="text-xl font-semibold">Key Features</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border rounded-lg p-4 shadow-sm">
                      <h3 className="font-medium text-lg mb-2">Upcoming Interviews</h3>
                      <p className="text-sm text-gray-600 mb-3">
                        View all your scheduled interviews in one place, sorted by date.
                      </p>
                      <Link to="/upcoming-interviews" className="text-indigo-600 hover:text-indigo-800 text-sm">
                        View your upcoming interviews →
                      </Link>
                    </div>
                    
                    <div className="border rounded-lg p-4 shadow-sm">
                      <h3 className="font-medium text-lg mb-2">Job Post Analysis</h3>
                      <p className="text-sm text-gray-600 mb-3">
                        Get insights from job postings to better understand what employers are looking for.
                      </p>
                      <Link to="/applications" className="text-indigo-600 hover:text-indigo-800 text-sm">
                        Go to your applications →
                      </Link>
                    </div>
                    
                    <div className="border rounded-lg p-4 shadow-sm">
                      <h3 className="font-medium text-lg mb-2">Practice Questions</h3>
                      <p className="text-sm text-gray-600 mb-3">
                        Review tailored questions and prepare answers specific to each job.
                      </p>
                    </div>
                    
                    <div className="border rounded-lg p-4 shadow-sm">
                      <h3 className="font-medium text-lg mb-2">Notifications</h3>
                      <p className="text-sm text-gray-600 mb-3">
                        Get reminders about upcoming interviews so you're always prepared.
                      </p>
                    </div>
                  </div>
                </section>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="job-analysis">
            <Card>
              <CardHeader>
                <CardTitle>Job Posting Analysis</CardTitle>
                <CardDescription>
                  How to extract insights from job postings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <section className="space-y-4">
                  <h2 className="text-xl font-semibold">Using the Job Analysis Tool</h2>
                  <ol className="list-decimal pl-6 space-y-4">
                    <li>
                      <h3 className="font-medium">Find a job posting</h3>
                      <p className="text-gray-700 mt-1">When you come across a job posting that interests you, copy the URL.</p>
                    </li>
                    
                    <li>
                      <h3 className="font-medium">Add it to your applications</h3>
                      <p className="text-gray-700 mt-1">Add the job to your application tracking in JobZai.</p>
                    </li>
                    
                    <li>
                      <h3 className="font-medium">Analyze the posting</h3>
                      <p className="text-gray-700 mt-1">
                        From the application details page, click on "Analyze Job Posting" and paste the URL.
                      </p>
                    </li>
                    
                    <li>
                      <h3 className="font-medium">Review the analysis</h3>
                      <p className="text-gray-700 mt-1">
                        JobZai will extract key skills, requirements, responsibilities, and company information.
                      </p>
                    </li>
                  </ol>
                </section>
                
                <section className="space-y-4">
                  <h2 className="text-xl font-semibold">What You'll Get</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-medium text-lg mb-2">Key Requirements</h3>
                      <p className="text-sm text-gray-600">
                        Essential skills and qualifications the employer is looking for
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-medium text-lg mb-2">Responsibilities</h3>
                      <p className="text-sm text-gray-600">
                        Day-to-day tasks and responsibilities of the role
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-medium text-lg mb-2">Company Values</h3>
                      <p className="text-sm text-gray-600">
                        Insights into the company culture and values
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-medium text-lg mb-2">Suggested Questions</h3>
                      <p className="text-sm text-gray-600">
                        Practice questions generated based on the job description
                      </p>
                    </div>
                  </div>
                </section>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="interview-prep">
            <Card>
              <CardHeader>
                <CardTitle>Interview Preparation</CardTitle>
                <CardDescription>
                  How to prepare for your upcoming interviews
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <section className="space-y-4">
                  <h2 className="text-xl font-semibold">Preparing for Interviews</h2>
                  <p>
                    JobZai helps you prepare for different types of interviews with tailored approach for each:
                  </p>
                  
                  <div className="space-y-6 mt-4">
                    <div className="border-l-4 border-blue-500 pl-4 py-2">
                      <h3 className="font-medium text-lg">HR/Screening Interviews</h3>
                      <p className="text-gray-700 mt-1">
                        Focus on your background, resume, and basic cultural fit. Prepare to discuss your experience,
                        career goals, and why you're interested in the company.
                      </p>
                    </div>
                    
                    <div className="border-l-4 border-green-500 pl-4 py-2">
                      <h3 className="font-medium text-lg">Technical Interviews</h3>
                      <p className="text-gray-700 mt-1">
                        Prepare for technical questions, coding challenges, and discussions about your technical expertise.
                        JobZai generates likely technical questions based on the job requirements.
                      </p>
                    </div>
                    
                    <div className="border-l-4 border-purple-500 pl-4 py-2">
                      <h3 className="font-medium text-lg">Manager Interviews</h3>
                      <p className="text-gray-700 mt-1">
                        Focus on leadership, teamwork, conflict resolution, and your ability to contribute to the team.
                        Prepare examples of past work and achievements.
                      </p>
                    </div>
                    
                    <div className="border-l-4 border-amber-500 pl-4 py-2">
                      <h3 className="font-medium text-lg">Final Interviews</h3>
                      <p className="text-gray-700 mt-1">
                        Often combines elements of all previous interviews. Be ready to discuss salary expectations,
                        start dates, and any remaining questions about the role.
                      </p>
                    </div>
                  </div>
                </section>
                
                <section className="space-y-4 mt-8">
                  <h2 className="text-xl font-semibold">Using Practice Questions</h2>
                  <p>
                    For each interview, JobZai generates specific practice questions:
                  </p>
                  
                  <ol className="list-decimal pl-6 space-y-3">
                    <li>Access your interview preparation page from your upcoming interviews</li>
                    <li>Review the list of suggested questions for that interview type</li>
                    <li>Practice your answers, using the AI-suggested talking points as a guide</li>
                    <li>Prepare your own questions to ask the interviewer</li>
                  </ol>
                  
                  <div className="bg-indigo-50 p-4 rounded-lg mt-4">
                    <h3 className="font-medium text-lg mb-2">Pro Tip</h3>
                    <p className="text-sm text-gray-700">
                      Always research the company before your interview. Use the job analysis insights to tailor your
                      answers to what the company values most.
                    </p>
                  </div>
                </section>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <div className="mt-8 border-t pt-6">
          <h2 className="text-xl font-semibold mb-4">Need More Help?</h2>
          <p className="mb-4">
            If you have any questions or need assistance with the interview preparation features,
            please contact our support team.
          </p>
          <Link 
            to="/settings" 
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
} 
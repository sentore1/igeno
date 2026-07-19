'use client';

import { useState } from 'react';

interface EnhancedCourseFormProps {
  formData: any;
  setFormData: (data: any) => void;
  learningOutcomes: string[];
  setLearningOutcomes: (outcomes: string[]) => void;
  resources: any[];
  setResources: (resources: any[]) => void;
  quizzes: any[];
  setQuizzes: (quizzes: any[]) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function EnhancedCourseForm({
  formData,
  setFormData,
  learningOutcomes,
  setLearningOutcomes,
  resources,
  setResources,
  quizzes,
  setQuizzes,
  activeTab,
  setActiveTab,
}: EnhancedCourseFormProps) {
  const [learningOutcome, setLearningOutcome] = useState('');
  const [currentResource, setCurrentResource] = useState({
    title: '',
    description: '',
    resource_type: 'pdf',
    resource_url: '',
    is_downloadable: true,
  });
  const [currentQuiz, setCurrentQuiz] = useState({
    title: '',
    description: '',
    passing_score: 70,
    time_limit_minutes: 30,
    max_attempts: 3,
    is_required: false,
    questions: [] as any[],
  });
  const [currentQuestion, setCurrentQuestion] = useState({
    question: '',
    options: ['', '', '', ''],
    correct_answer: 0,
  });

  const addLearningOutcome = () => {
    if (learningOutcome.trim()) {
      setLearningOutcomes([...learningOutcomes, learningOutcome]);
      setLearningOutcome('');
    }
  };

  const addResource = () => {
    if (currentResource.title && currentResource.resource_url) {
      setResources([...resources, currentResource]);
      setCurrentResource({
        title: '',
        description: '',
        resource_type: 'pdf',
        resource_url: '',
        is_downloadable: true,
      });
    }
  };

  const addQuestion = () => {
    if (currentQuestion.question && currentQuestion.options.every(opt => opt.trim())) {
      setCurrentQuiz({
        ...currentQuiz,
        questions: [...currentQuiz.questions, { ...currentQuestion, id: Date.now().toString() }],
      });
      setCurrentQuestion({
        question: '',
        options: ['', '', '', ''],
        correct_answer: 0,
      });
    }
  };

  const addQuiz = () => {
    if (currentQuiz.title && currentQuiz.questions.length > 0) {
      setQuizzes([...quizzes, currentQuiz]);
      setCurrentQuiz({
        title: '',
        description: '',
        passing_score: 70,
        time_limit_minutes: 30,
        max_attempts: 3,
        is_required: false,
        questions: [],
      });
    }
  };

  return (
    <>
      {/* Tabs */}
      <div className="flex border-b bg-gray-50 -mx-6 px-6">
        <button
          type="button"
          onClick={() => setActiveTab('details')}
          className={`flex-1 px-6 py-3 font-semibold text-sm transition ${
            activeTab === 'details'
              ? 'bg-white text-purple-600 border-b-2 border-purple-600'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Course Details
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('resources')}
          className={`flex-1 px-6 py-3 font-semibold text-sm transition ${
            activeTab === 'resources'
              ? 'bg-white text-purple-600 border-b-2 border-purple-600'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Resources ({resources.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('quizzes')}
          className={`flex-1 px-6 py-3 font-semibold text-sm transition ${
            activeTab === 'quizzes'
              ? 'bg-white text-purple-600 border-b-2 border-purple-600'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Quizzes ({quizzes.length})
        </button>
      </div>

      {/* Tab Content */}
      <div className="mt-6 space-y-5">
        {/* Details Tab */}
        {activeTab === 'details' && (
          <>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Course Title *
              </label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="e.g., Introduction to Elderly Care"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                required
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="Describe what students will learn..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="Caregiver Training">Caregiver Training</option>
                  <option value="Nursing Skills">Nursing Skills</option>
                  <option value="Health & Safety">Health & Safety</option>
                  <option value="Communication">Communication</option>
                  <option value="Career Development">Career Development</option>
                  <option value="Specialized Care">Specialized Care</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Duration (hours) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  value={formData.duration_hours}
                  onChange={(e) => setFormData({ ...formData, duration_hours: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                YouTube URL (optional)
              </label>
              <input
                type="url"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="https://youtube.com/watch?v=..."
                value={formData.youtube_url}
                onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
              />
              <p className="text-xs text-gray-500 mt-1">Add a course introduction or overview video</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Prerequisites (optional)
              </label>
              <textarea
                rows={2}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="What should students know before taking this course?"
                value={formData.prerequisites}
                onChange={(e) => setFormData({ ...formData, prerequisites: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Learning Outcomes
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., Understand basic caregiving techniques"
                  value={learningOutcome}
                  onChange={(e) => setLearningOutcome(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLearningOutcome())}
                />
                <button
                  type="button"
                  onClick={addLearningOutcome}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Add
                </button>
              </div>
              <div className="space-y-2">
                {learningOutcomes.map((outcome, index) => (
                  <div key={index} className="flex items-center gap-2 bg-purple-50 p-2 rounded">
                    <span className="flex-1 text-sm">✓ {outcome}</span>
                    <button
                      type="button"
                      onClick={() => setLearningOutcomes(learningOutcomes.filter((_, i) => i !== index))}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  checked={formData.is_published}
                  onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                />
                <span className="ml-3 text-sm font-semibold text-gray-900">
                  Publish immediately
                </span>
              </label>
            </div>
          </>
        )}

        {/* Resources Tab */}
        {activeTab === 'resources' && (
          <>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-blue-900 mb-2">Add Course Resources</h3>
              <p className="text-sm text-blue-700">
                Add PDFs, videos, links, and other materials that students can access.
              </p>
            </div>

            <div className="border rounded-lg p-4 bg-gray-50">
              <h4 className="font-semibold mb-3">New Resource</h4>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Resource Title *</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="e.g., Course Syllabus"
                    value={currentResource.title}
                    onChange={(e) => setCurrentResource({ ...currentResource, title: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Resource Type *</label>
                  <select
                    className="w-full px-3 py-2 border rounded-lg"
                    value={currentResource.resource_type}
                    onChange={(e) => setCurrentResource({ ...currentResource, resource_type: e.target.value })}
                  >
                    <option value="pdf">PDF Document</option>
                    <option value="video">Video (YouTube/Vimeo)</option>
                    <option value="link">External Link</option>
                    <option value="document">Document</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Resource URL * 
                    {currentResource.resource_type === 'video' && ' (YouTube/Vimeo link)'}
                  </label>
                  <input
                    type="url"
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="https://..."
                    value={currentResource.resource_url}
                    onChange={(e) => setCurrentResource({ ...currentResource, resource_url: e.target.value })}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Provide direct link to PDF, video, or other resource
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    rows={2}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Brief description of this resource"
                    value={currentResource.description}
                    onChange={(e) => setCurrentResource({ ...currentResource, description: e.target.value })}
                  />
                </div>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-purple-600 rounded"
                    checked={currentResource.is_downloadable}
                    onChange={(e) => setCurrentResource({ ...currentResource, is_downloadable: e.target.checked })}
                  />
                  <span className="ml-2 text-sm">Allow students to download</span>
                </label>

                <button
                  type="button"
                  onClick={addResource}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Resource
                </button>
              </div>
            </div>

            {/* Resources List */}
            {resources.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold mb-3">Added Resources ({resources.length})</h4>
                <div className="space-y-2">
                  {resources.map((resource, index) => (
                    <div key={index} className="flex items-center gap-2 bg-white p-3 rounded border">
                      <div className="flex-1">
                        <div className="font-medium">{resource.title}</div>
                        <div className="text-sm text-gray-600">
                          {resource.resource_type} • {resource.resource_url.substring(0, 50)}...
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setResources(resources.filter((_, i) => i !== index))}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Quizzes Tab */}
        {activeTab === 'quizzes' && (
          <>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-green-900 mb-2">Add Course Quizzes</h3>
              <p className="text-sm text-green-700">
                Create quizzes to assess student understanding of the course material.
              </p>
            </div>

            <div className="border rounded-lg p-4 bg-gray-50">
              <h4 className="font-semibold mb-3">New Quiz</h4>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Quiz Title *</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="e.g., Module 1 Assessment"
                    value={currentQuiz.title}
                    onChange={(e) => setCurrentQuiz({ ...currentQuiz, title: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    rows={2}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="What does this quiz cover?"
                    value={currentQuiz.description}
                    onChange={(e) => setCurrentQuiz({ ...currentQuiz, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Passing Score (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      className="w-full px-3 py-2 border rounded-lg"
                      value={currentQuiz.passing_score}
                      onChange={(e) => setCurrentQuiz({ ...currentQuiz, passing_score: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Time Limit (min)</label>
                    <input
                      type="number"
                      min="5"
                      className="w-full px-3 py-2 border rounded-lg"
                      value={currentQuiz.time_limit_minutes}
                      onChange={(e) => setCurrentQuiz({ ...currentQuiz, time_limit_minutes: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Max Attempts</label>
                    <input
                      type="number"
                      min="1"
                      className="w-full px-3 py-2 border rounded-lg"
                      value={currentQuiz.max_attempts}
                      onChange={(e) => setCurrentQuiz({ ...currentQuiz, max_attempts: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-purple-600 rounded"
                    checked={currentQuiz.is_required}
                    onChange={(e) => setCurrentQuiz({ ...currentQuiz, is_required: e.target.checked })}
                  />
                  <span className="ml-2 text-sm">Required for course completion</span>
                </label>

                {/* Question Builder */}
                <div className="border-t pt-3 mt-3">
                  <h5 className="font-medium mb-2">Add Questions</h5>
                  
                  <div className="space-y-2">
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Question text"
                      value={currentQuestion.question}
                      onChange={(e) => setCurrentQuestion({ ...currentQuestion, question: e.target.value })}
                    />
                    
                    {currentQuestion.options.map((option, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="correct-answer"
                          checked={currentQuestion.correct_answer === index}
                          onChange={() => setCurrentQuestion({ ...currentQuestion, correct_answer: index })}
                        />
                        <input
                          type="text"
                          className="flex-1 px-3 py-2 border rounded-lg"
                          placeholder={`Option ${index + 1}`}
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...currentQuestion.options];
                            newOptions[index] = e.target.value;
                            setCurrentQuestion({ ...currentQuestion, options: newOptions });
                          }}
                        />
                      </div>
                    ))}
                    
                    <button
                      type="button"
                      onClick={addQuestion}
                      className="w-full px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                    >
                      Add Question
                    </button>
                  </div>

                  {/* Questions List */}
                  {currentQuiz.questions.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <div className="font-medium text-sm">Questions ({currentQuiz.questions.length})</div>
                      {currentQuiz.questions.map((q, index) => (
                        <div key={q.id} className="bg-white p-2 rounded border text-sm">
                          <div className="font-medium">{index + 1}. {q.question}</div>
                          <div className="text-gray-600 text-xs">
                            Correct: {q.options[q.correct_answer]}
                          </div>
                          <button
                            type="button"
                            onClick={() => setCurrentQuiz({
                              ...currentQuiz,
                              questions: currentQuiz.questions.filter((_, i) => i !== index)
                            })}
                            className="text-red-600 text-xs mt-1"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={addQuiz}
                  disabled={!currentQuiz.title || currentQuiz.questions.length === 0}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  Save Quiz
                </button>
              </div>
            </div>

            {/* Quizzes List */}
            {quizzes.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold mb-3">Added Quizzes ({quizzes.length})</h4>
                <div className="space-y-2">
                  {quizzes.map((quiz, index) => (
                    <div key={index} className="bg-white p-3 rounded border">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium">{quiz.title}</div>
                          <div className="text-sm text-gray-600">
                            {quiz.questions.length} questions • {quiz.passing_score}% to pass • 
                            {quiz.time_limit_minutes} min • {quiz.max_attempts} attempts
                            {quiz.is_required && ' • Required'}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setQuizzes(quizzes.filter((_, i) => i !== index))}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

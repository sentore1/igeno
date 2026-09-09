'use client';

import { useState, useEffect, useRef } from 'react';
import RichTextEditor from './RichTextEditor';
import { createBrowserClient } from '@/lib/supabase-client';

interface CourseCategory {
  id: string;
  name: string;
  color: string;
}

interface EnhancedCourseFormProps {
  formData: any;
  setFormData: (data: any) => void;
  learningOutcomes: string[];
  setLearningOutcomes: (outcomes: string[]) => void;
  resources: any[];
  setResources: (resources: any[]) => void;
  quizzes: any[];
  setQuizzes: (quizzes: any[]) => void;
  activeTab: 'details' | 'resources' | 'quizzes';
  setActiveTab: (tab: 'details' | 'resources' | 'quizzes') => void;
  featuredImage?: File | null;
  setFeaturedImage?: (file: File | null) => void;
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
  featuredImage,
  setFeaturedImage,
}: EnhancedCourseFormProps) {
  const [categories, setCategories] = useState<CourseCategory[]>([]);
  const [learningOutcome, setLearningOutcome] = useState('');

  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.json())
      .then(json => { if (json.categories) setCategories(json.categories); })
      .catch(() => {/* silently fall back to empty list */});
  }, []);
  const [currentResource, setCurrentResource] = useState({
    title: '',
    description: '',
    resource_type: 'pdf',
    resource_url: '',
    is_downloadable: true,
  });
  const [resourceFile, setResourceFile] = useState<File | null>(null);
  const [uploadingResource, setUploadingResource] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createBrowserClient();
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

  const addResource = async () => {
    if (!currentResource.title) return;

    let resourceUrl = currentResource.resource_url;

    if (resourceFile) {
      setUploadingResource(true);
      try {
        const ext = resourceFile.name.split('.').pop();
        const path = `resources/${Date.now()}-${resourceFile.name}`;
        const { error } = await supabase.storage
          .from('course-files')
          .upload(path, resourceFile);
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage
          .from('course-files')
          .getPublicUrl(path);
        resourceUrl = publicUrl;
      } catch (err: any) {
        alert(`Upload failed: ${err.message}`);
        setUploadingResource(false);
        return;
      } finally {
        setUploadingResource(false);
      }
    }

    if (!resourceUrl) return;

    setResources([...resources, { ...currentResource, resource_url: resourceUrl }]);
    setCurrentResource({ title: '', description: '', resource_type: 'pdf', resource_url: '', is_downloadable: true });
    setResourceFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
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
                Introduction *
              </label>
              <textarea
                required
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="Write a brief introduction that welcomes students and gives an overview of what they'll learn..."
                value={formData.introduction || ''}
                onChange={(e) => setFormData({ ...formData, introduction: e.target.value })}
              />
              <p className="text-xs text-gray-500 mt-1">
                This introduction will be shown to students before they enroll in the course
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Course Description *
              </label>
              <RichTextEditor
                value={formData.description}
                onChange={(value) => setFormData({ ...formData, description: value })}
                placeholder="Write a detailed description of the course content, objectives, and what students will gain..."
                minHeight="250px"
              />
              <p className="text-xs text-gray-500 mt-1">
                Use the toolbar to format your course description with headings, bold, italic, lists, and more
              </p>
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
                  <option value="">Select a category…</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
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

            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Price (RWF)
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter 0 for free course"
                  value={formData.price || 0}
                  onChange={(e) => {
                    const price = parseFloat(e.target.value) || 0;
                    setFormData({ 
                      ...formData, 
                      price,
                      is_free: price === 0,
                      requires_payment: price > 0
                    });
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Set to 0 for a free course
                </p>
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
                <p className="text-xs text-gray-500 mt-1">Course intro video</p>
              </div>
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
                Featured Image *
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition">
                {featuredImage || formData.featured_image_url ? (
                  <div className="space-y-3">
                    <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={featuredImage ? URL.createObjectURL(featuredImage) : formData.featured_image_url}
                        alt="Featured"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (setFeaturedImage) setFeaturedImage(null);
                        setFormData({ ...formData, featured_image_url: null });
                      }}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Remove Image
                    </button>
                  </div>
                ) : (
                  <div>
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <label htmlFor="featured-image" className="cursor-pointer">
                      <span className="text-purple-600 hover:text-purple-700 font-medium">
                        Click to upload
                      </span>
                      <span className="text-gray-500"> or drag and drop</span>
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      PNG, JPG, GIF up to 5MB (Recommended: 800x400px)
                    </p>
                    <input
                      id="featured-image"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file && setFeaturedImage) {
                          if (file.size > 5 * 1024 * 1024) {
                            alert('Image size must be less than 5MB');
                            return;
                          }
                          setFeaturedImage(file);
                        }
                      }}
                      className="hidden"
                    />
                  </div>
                )}
              </div>
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

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-3">
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
              
              {(formData.price > 0 || !formData.is_free) && (
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    checked={formData.requires_payment}
                    onChange={(e) => setFormData({ ...formData, requires_payment: e.target.checked })}
                  />
                  <span className="ml-3 text-sm font-semibold text-gray-900">
                    Require payment approval before course access
                  </span>
                </label>
              )}
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
                    onChange={(e) => {
                      setCurrentResource({ ...currentResource, resource_type: e.target.value, resource_url: '' });
                      setResourceFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                  >
                    <option value="pdf">PDF Document</option>
                    <option value="image">Image (PNG/JPG)</option>
                    <option value="document">Document (Word/Excel)</option>
                    <option value="video">Video (YouTube/Vimeo link)</option>
                    <option value="link">External Link</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* File upload for pdf, image, document, other */}
                {['pdf', 'image', 'document', 'other'].includes(currentResource.resource_type) ? (
                  <div>
                    <label className="block text-sm font-medium mb-1">Upload File *</label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={
                        currentResource.resource_type === 'pdf' ? '.pdf' :
                        currentResource.resource_type === 'image' ? 'image/*' :
                        currentResource.resource_type === 'document' ? '.doc,.docx,.xls,.xlsx,.ppt,.pptx' :
                        '*/*'
                      }
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setResourceFile(file);
                        if (file) setCurrentResource({ ...currentResource, resource_url: file.name });
                      }}
                    />
                    {resourceFile && (
                      <p className="text-xs text-green-600 mt-1">✓ {resourceFile.name} ({(resourceFile.size / 1024).toFixed(1)} KB)</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">File will be uploaded to secure storage</p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {currentResource.resource_type === 'video' ? 'Video URL (YouTube/Vimeo) *' : 'URL *'}
                    </label>
                    <input
                      type="url"
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="https://..."
                      value={currentResource.resource_url}
                      onChange={(e) => setCurrentResource({ ...currentResource, resource_url: e.target.value })}
                    />
                  </div>
                )}

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
                  disabled={uploadingResource || !currentResource.title || (!resourceFile && !currentResource.resource_url)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {uploadingResource ? 'Uploading...' : 'Add Resource'}
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

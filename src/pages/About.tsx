
import { useEffect, useRef, useState } from 'react';
import { AnimationController } from '../utils/animations';
import { Github, ExternalLink } from 'lucide-react';

interface GitHubRepo {
  id: number;
  name: string;
  description: string;
  html_url: string;
  language: string;
  stargazers_count: number;
  updated_at: string;
}

const About = () => {
  const headerRef = useRef<HTMLDivElement>(null);
  const reposRef = useRef<HTMLDivElement>(null);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (headerRef.current) {
      AnimationController.pageTransition(headerRef.current, 'in');
    }
  }, []);

  useEffect(() => {
    const fetchGitHubRepos = async () => {
      try {
        // Using a demo GitHub username - replace with your actual username
        const response = await fetch('https://api.github.com/users/octocat/repos?sort=updated&per_page=6');
        const data = await response.json();
        setRepos(data);
        
        if (reposRef.current) {
          setTimeout(() => {
            AnimationController.staggerFadeIn(
              Array.from(reposRef.current!.children) as HTMLElement[], 
              0.1
            );
          }, 300);
        }
      } catch (error) {
        console.error('Error fetching GitHub repos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGitHubRepos();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen pt-24 pb-16 bg-white">
      <div className="container mx-auto px-6">
        {/* Header Section */}
        <div ref={headerRef} className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-light mb-6 text-neutral-900">
            About Us
          </h1>
          <p className="text-xl text-neutral-600 max-w-3xl mx-auto leading-relaxed">
            We're passionate about creating minimal, elegant products that enhance your everyday life. 
            Our mission is to combine functionality with timeless design.
          </p>
        </div>

        {/* Story Section */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-light mb-6 text-neutral-900">Our Story</h2>
              <p className="text-neutral-600 leading-relaxed mb-4">
                Founded in 2024, we started with a simple belief: good design should be accessible to everyone. 
                Every product in our collection is carefully curated to meet our standards of quality, 
                functionality, and aesthetic appeal.
              </p>
              <p className="text-neutral-600 leading-relaxed">
                From fashion essentials to tech accessories, we focus on creating products that stand the test of time, 
                both in durability and style. Our minimalist approach ensures that every piece serves a purpose 
                while maintaining visual elegance.
              </p>
            </div>
            <div className="bg-neutral-100 rounded-lg h-64 flex items-center justify-center">
              <p className="text-neutral-500">Our Design Philosophy</p>
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-light text-center mb-12 text-neutral-900">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Quality First',
                description: 'We never compromise on quality. Every product is thoroughly tested and meets our high standards.'
              },
              {
                title: 'Minimal Design',
                description: 'Less is more. We believe in clean, functional design that eliminates unnecessary complexity.'
              },
              {
                title: 'Sustainability',
                description: 'We care about our planet. Our products are designed to last and our packaging is eco-friendly.'
              }
            ].map((value, index) => (
              <div key={index} className="text-center p-6 rounded-lg border border-neutral-200">
                <h3 className="text-xl font-medium mb-4 text-neutral-900">{value.title}</h3>
                <p className="text-neutral-600 leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* GitHub Projects Section */}
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-light mb-4 text-neutral-900">Open Source Projects</h2>
            <p className="text-neutral-600">
              We believe in giving back to the community. Here are some of our recent projects.
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="border border-neutral-200 rounded-lg p-6 animate-pulse">
                  <div className="h-4 bg-neutral-200 rounded mb-3"></div>
                  <div className="h-3 bg-neutral-200 rounded mb-2"></div>
                  <div className="h-3 bg-neutral-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : (
            <div ref={reposRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {repos.map((repo) => (
                <div key={repo.id} className="border border-neutral-200 rounded-lg p-6 hover:shadow-lg transition-shadow duration-300">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-medium text-neutral-900 flex items-center gap-2">
                      <Github size={20} />
                      {repo.name}
                    </h3>
                    <a
                      href={repo.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-neutral-500 hover:text-neutral-700 transition-colors"
                    >
                      <ExternalLink size={16} />
                    </a>
                  </div>
                  
                  <p className="text-neutral-600 text-sm mb-4 line-clamp-2">
                    {repo.description || 'No description available'}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-neutral-500">
                    <div className="flex items-center gap-4">
                      {repo.language && (
                        <span className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          {repo.language}
                        </span>
                      )}
                      <span>⭐ {repo.stargazers_count}</span>
                    </div>
                    <span>Updated {formatDate(repo.updated_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Contact Section */}
        <div className="text-center mt-16 pt-16 border-t border-neutral-200">
          <h2 className="text-2xl font-light mb-4 text-neutral-900">Get in Touch</h2>
          <p className="text-neutral-600 mb-6">
            Have questions about our products or want to collaborate? We'd love to hear from you.
          </p>
          <a
            href="mailto:hello@ethereal.com"
            className="inline-block bg-neutral-900 text-white px-8 py-3 rounded font-medium hover:bg-neutral-800 transition-colors"
          >
            Contact Us
          </a>
        </div>
      </div>
    </div>
  );
};

export default About;

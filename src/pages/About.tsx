import { useEffect, useRef, useState } from 'react';
import { AnimationController } from '../utils/animations';
import { Github, ExternalLink, GitCommit } from 'lucide-react';
import ContactUsModal from '../components/ContactUsModal';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';

interface GitHubRepo {
  id: number;
  name: string;
  description: string;
  html_url: string;
  language: string;
  stargazers_count: number;
  updated_at: string;
  owner: { login: string };
}

interface Commit {
  sha: string;
  commit: {
    message: string;
    author: { name: string; date: string };
  };
  html_url: string;
}

interface GitHubUser {
  avatar_url: string;
  bio: string;
  name: string;
  login: string;
  html_url: string;
  public_repos: number;
  followers: number;
  following: number;
  location?: string;
}

const GITHUB_USER = 'b33lz3bubTH';

const About = () => {
  const headerRef = useRef<HTMLDivElement>(null);
  const reposRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [commits, setCommits] = useState<Record<string, Commit[]>>({});
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [contactOpen, setContactOpen] = useState(false);
  const owner = useSelector((s: RootState) => s.siteConfig.config.storeOwner);

  useEffect(() => {
    if (headerRef.current) {
      AnimationController.pageTransition(headerRef.current, 'in');
    }
  }, []);

  useEffect(() => {
    const fetchGitHubData = async () => {
      try {
        const userRes = await fetch(`https://api.github.com/users/${GITHUB_USER}`);
        const userData = await userRes.json();
        setUser(userData);
        const response = await fetch(`https://api.github.com/users/${GITHUB_USER}/repos?sort=updated&per_page=6`);
        const data = await response.json();
        setRepos(data);
        const commitsObj: Record<string, Commit[]> = {};
        await Promise.all(
          data.map(async (repo: GitHubRepo) => {
            try {
              const res = await fetch(`https://api.github.com/repos/${GITHUB_USER}/${repo.name}/commits?per_page=3`);
              const commitData = await res.json();
              commitsObj[repo.name] = commitData;
            } catch {}
          })
        );
        setCommits(commitsObj);
        if (reposRef.current) {
          setTimeout(() => {
            AnimationController.staggerFadeIn(
              Array.from(reposRef.current!.children) as HTMLElement[],
              0.1
            );
          }, 300);
        }
        if (profileRef.current) {
          AnimationController.staggerFadeIn([profileRef.current], 0.1);
        }
      } catch (error) {
        console.error('Error fetching GitHub data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchGitHubData();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen pt-20 md:pt-16 pb-16 bg-white">
      <div className="container mx-auto px-6">
        <div ref={headerRef} className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-light mb-6 text-neutral-900">
            About the Creator
          </h1>
        </div>
        <div ref={profileRef} className="max-w-4xl mx-auto mb-16 flex flex-col md:flex-row items-center gap-8 bg-neutral-50 rounded-xl p-8 shadow-md">
          {user && (
            <>
              <img src={user.avatar_url} alt={user.login} className="w-32 h-32 rounded-full border-4 border-neutral-200 shadow-lg" />
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-3xl font-semibold text-neutral-900 mb-2 flex items-center justify-center md:justify-start gap-2">
                  <Github size={28} /> {user.name || user.login}
                </h2>
                <p className="text-neutral-600 mb-2">{user.bio}</p>
                <div className="flex flex-wrap gap-4 justify-center md:justify-start text-neutral-500 text-sm mb-2">
                  <span>@{user.login}</span>
                  {user.location && <span>{user.location}</span>}
                  <span>{user.public_repos} repos</span>
                  <span>{user.followers} followers</span>
                  <span>{user.following} following</span>
                </div>
                <a href={user.html_url} target="_blank" rel="noopener noreferrer" className="underline text-neutral-700 hover:text-neutral-900 transition-colors">View GitHub Profile</a>
              </div>
            </>
          )}
          <div className="w-full md:w-auto mt-8 md:mt-0 flex justify-center">
            <img
              src={`https://ghchart.rshah.org/${GITHUB_USER}`}
              alt="GitHub Contribution Graph"
              className="rounded-lg border border-neutral-200 shadow"
              style={{ maxWidth: 320, width: '100%' }}
            />
          </div>
        </div>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-light mb-4 text-neutral-900">Open Source Projects</h2>
            <p className="text-neutral-600">
              Recent projects and commit activity from <a href={`https://github.com/${GITHUB_USER}`} className="underline" target="_blank" rel="noopener noreferrer">@{GITHUB_USER}</a>.
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
                <div key={repo.id} className="border border-neutral-200 rounded-lg p-6 hover:shadow-lg transition-shadow duration-300 bg-white flex flex-col h-full">
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
                  <div className="flex items-center justify-between text-xs text-neutral-500 mb-2">
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
                  <div className="mt-4">
                    <h4 className="text-xs font-semibold text-neutral-700 mb-2"><GitCommit size={14}/> Recent Commits</h4>
                    <ul className="space-y-1">
                      {(commits[repo.name] || []).map((commit) => (
                        <li key={commit.sha} className="text-xs text-neutral-600 flex flex-col md:flex-row md:items-center md:gap-2">
                          <a href={commit.html_url} target="_blank" rel="noopener noreferrer" className="hover:underline block md:inline">
                            {commit.commit.message.length > 40 ? commit.commit.message.slice(0, 40) + '…' : commit.commit.message}
                          </a>
                          <span className="text-neutral-400 block md:inline">by {commit.commit.author.name}</span>
                          <span className="text-neutral-400 block md:inline">{formatDate(commit.commit.author.date)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="text-center mt-16 pt-20 md:pt-16 border-t border-neutral-200">
          <h2 className="text-2xl font-light mb-4 text-neutral-900">Get in Touch</h2>
          <p className="text-neutral-600 mb-4">
            Have questions about our products or want to collaborate? We'd love to hear from you.
          </p>
          {owner && (owner.email || owner.phone) && (
            <p className="text-sm text-neutral-600 mb-6">For urgent queries contact {owner.name ? owner.name + ' at ' : ''}
              {owner.email && (<a className="underline" href={`mailto:${owner.email}`}>{owner.email}</a>)}
              {(owner.email && owner.phone) && ' or '}
              {owner.phone && (<a className="underline" href={`tel:${owner.phone}`}>{owner.phone}</a>)}</p>
          )}
          <button
            onClick={() => setContactOpen(true)}
            className="inline-block bg-neutral-900 text-white px-8 py-3 rounded font-medium hover:bg-neutral-800 transition-colors"
          >
            Contact Us
          </button>
          <ContactUsModal isOpen={contactOpen} onClose={() => setContactOpen(false)} />
        </div>
      </div>
    </div>
  );
};

export default About;

document.addEventListener('DOMContentLoaded', () => {

    /* =========================================================================
       Extra 1: Dark/Light Mode Theme Toggle
       ========================================================================= */
    const themeToggleBtn = document.getElementById('theme-toggle');
    const moonIcon = document.getElementById('moon-icon');
    const sunIcon = document.getElementById('sun-icon');
    const htmlElement = document.documentElement;

    const statsCard = document.getElementById('github-stats-card');
    const langsCard = document.getElementById('github-langs-card');

    const updateStatsTheme = (theme) => {
        const statsTheme = theme === 'dark' ? 'radical' : 'default'; // 'radical' is a nice dark theme
        if (statsCard) statsCard.src = `https://github-readme-stats.vercel.app/api?username=chanhisme&show_icons=true&theme=${statsTheme}&hide_border=true&bg_color=ffffff00`;
        if (langsCard) langsCard.src = `https://github-readme-stats.vercel.app/api/top-langs/?username=chanhisme&layout=compact&theme=${statsTheme}&hide_border=true&bg_color=ffffff00`;
    };

    // Check localStorage for saved theme, default to 'light'
    const savedTheme = localStorage.getItem('theme') || 'light';
    
    // Apply saved theme on load
    if (savedTheme === 'dark') {
        htmlElement.setAttribute('data-theme', 'dark');
        moonIcon.style.display = 'none';
        sunIcon.style.display = 'block';
        updateStatsTheme('dark');
    }

    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = htmlElement.getAttribute('data-theme');
        let newTheme = 'light';

        if (currentTheme !== 'dark') {
            newTheme = 'dark';
            moonIcon.style.display = 'none';
            sunIcon.style.display = 'block';
        } else {
            moonIcon.style.display = 'block';
            sunIcon.style.display = 'none';
        }

        htmlElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme); // Persist state
        updateStatsTheme(newTheme); // Update Stats Theme
    });

    /* =========================================================================
       Extra 2: Intelligent GitHub Repo Showcase (Including Group Repos)
       ========================================================================= */
    const projectsGrid = document.getElementById('projects-grid');
    const loadingState = document.getElementById('projects-loading');
    const errorState = document.getElementById('projects-error');
    const githubUsername = 'chanhisme'; // Provided by user

    const externalReposToFetch = [
        'hoangphamphuc59/gr10salemanage',
        'hdyui/Bug_Killer_Project_TrainC'
    ];

    async function fetchGitHubRepos() {
        try {
            // Fetch user's repos and external group repos simultaneously
            const [userReposRes, ...externalRes] = await Promise.all([
                fetch(`https://api.github.com/users/${githubUsername}/repos?per_page=100`),
                ...externalReposToFetch.map(repoPath => fetch(`https://api.github.com/repos/${repoPath}`))
            ]);
            
            if (!userReposRes.ok) {
                throw new Error('Network response was not ok');
            }
            
            let repos = await userReposRes.json();
            
            // Add successful external repos to the list
            for (let res of externalRes) {
                if (res.ok) {
                    const extRepo = await res.json();
                    repos.push(extRepo);
                }
            }
            
            // Remove loading state
            loadingState.style.display = 'none';

            // Target prioritized keywords
            const prioritizedKeywords = ['java', 'trainc', 'dsa'];

            const isPriority = (repoName) => {
                const lowerName = repoName.toLowerCase();
                return prioritizedKeywords.some(keyword => lowerName.includes(keyword));
            };

            // Filter out forks, but keep prioritized repos even if they lack descriptions
            let filteredRepos = repos.filter(repo => {
                if (repo.fork) return false;
                if (isPriority(repo.name)) return true;
                return repo.description && repo.description.trim() !== '';
            });

            // Sort prioritizing specific keywords, then stars, then by recency
            filteredRepos.sort((a, b) => {
                const aPriority = isPriority(a.name);
                const bPriority = isPriority(b.name);

                if (aPriority && !bPriority) return -1;
                if (!aPriority && bPriority) return 1;

                if (b.stargazers_count !== a.stargazers_count) {
                    return b.stargazers_count - a.stargazers_count;
                }
                return new Date(b.updated_at) - new Date(a.updated_at);
            });

            // Take the top 6 repos to showcase
            const topRepos = filteredRepos.slice(0, 6);

            // Render repositories
            if (topRepos.length === 0) {
                projectsGrid.innerHTML = '<p class="loading-state">No repositories found.</p>';
                return;
            }

            topRepos.forEach(repo => {
                const card = document.createElement('article');
                card.className = 'project-card';
                
                // Escape HTML to prevent XSS
                const repoName = repo.name.replace(/</g, "&lt;").replace(/>/g, "&gt;");
                const repoDesc = repo.description ? repo.description.replace(/</g, "&lt;").replace(/>/g, "&gt;") : 'No description provided.';
                
                card.innerHTML = `
                    <h3 class="project-title">${repoName}</h3>
                    <p class="project-desc">${repoDesc}</p>
                    <div class="project-meta">
                        <span class="language">${repo.language || 'Multiple / Unknown'}</span>
                        <span class="star-count" title="Stars">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                            ${repo.stargazers_count}
                        </span>
                    </div>
                    <a href="${repo.html_url}" target="_blank" rel="noopener" class="btn btn-secondary" style="text-align: center;">View Code</a>
                `;
                projectsGrid.appendChild(card);
            });

        } catch (error) {
            console.error('Error fetching repos:', error);
            loadingState.style.display = 'none';
            errorState.style.display = 'block';
        }
    }

    // Initiate fetch
    fetchGitHubRepos();


    /* =========================================================================
       Extra 3: Advanced Client-Side Form Validation
       ========================================================================= */
    const contactForm = document.getElementById('contact-form');
    
    // Validation rules
    const validateField = (input, validationFn, errorMsgId, customMessage) => {
        const formGroup = input.parentElement;
        const errorTooltip = document.getElementById(errorMsgId);
        
        if (!validationFn(input.value.trim())) {
            formGroup.classList.add('has-error');
            if (customMessage) {
                errorTooltip.textContent = customMessage;
            }
            return false;
        } else {
            formGroup.classList.remove('has-error');
            return true;
        }
    };

    const isNotEmpty = val => val.length > 0;
    const isValidEmail = val => {
        // Basic email regex pattern
        const pattern = /^[a-zA-Z0-O._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
        return pattern.test(val);
    };

    // Attach real-time validation on input/blur
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const messageInput = document.getElementById('message');

    [nameInput, messageInput].forEach(input => {
        input.addEventListener('input', () => validateField(input, isNotEmpty, `${input.id}-error`));
    });

    emailInput.addEventListener('input', () => {
        if (emailInput.value.trim() === '') {
            validateField(emailInput, isNotEmpty, 'email-error', 'Email is required');
        } else {
            validateField(emailInput, isValidEmail, 'email-error', 'Please enter a valid email');
        }
    });

    // Validate on Submit
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const isNameValid = validateField(nameInput, isNotEmpty, 'name-error');
        
        let isEmailValid = false;
        if (emailInput.value.trim() === '') {
            isEmailValid = validateField(emailInput, isNotEmpty, 'email-error', 'Email is required');
        } else {
            isEmailValid = validateField(emailInput, isValidEmail, 'email-error', 'Please enter a valid email');
        }

        const isMessageValid = validateField(messageInput, isNotEmpty, 'message-error');

        if (isNameValid && isEmailValid && isMessageValid) {
            // Simulate form submission
            const btn = contactForm.querySelector('button[type="submit"]');
            const originalText = btn.textContent;
            btn.textContent = 'Sending...';
            btn.disabled = true;

            setTimeout(() => {
                alert('Message sent successfully!');
                contactForm.reset();
                btn.textContent = originalText;
                btn.disabled = false;
                
                // Clear any leftover validation styles
                document.querySelectorAll('.form-group').forEach(group => group.classList.remove('has-error'));
            }, 1000);
        }
    });


    /* =========================================================================
       Extra 4: Smooth "Scroll to Top" Button
       ========================================================================= */
    const scrollToTopBtn = document.getElementById('scroll-to-top');

    window.addEventListener('scroll', () => {
        // Show button after 300px scrolling
        if (window.scrollY > 300) {
            scrollToTopBtn.classList.add('show');
        } else {
            scrollToTopBtn.classList.remove('show');
        }
    });

    scrollToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

});

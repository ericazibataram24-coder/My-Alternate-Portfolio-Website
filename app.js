// Track the current editor state mode ('compose' or 'html')
let currentEditorMode = "compose";

function switchEditorMode(mode) {
        currentEditorMode = mode;
            const textArea = document.getElementById('post-body');
                const label = document.getElementById('editor-label');
                    const composeBtn = document.getElementById('btn-mode-compose');
                        const htmlBtn = document.getElementById('btn-mode-html');

                            if (mode === 'html') {
                                        label.innerText = "HTML View (Code Mode)";
                                                label.style.color = "#d97706"; // Warn user it's code mode
                                                        textArea.placeholder = "<h1>Heading</h1>\n<p>Write your HTML elements directly here...</p>";
                                                                textArea.style.fontFamily = "monospace";
                                                                        textArea.style.background = "#1e293b";
                                                                                textArea.style.color = "#f8fafc";
                                                                                        
                                                                                                // Toggle button highlights
                                                                                                        htmlBtn.style.background = "#d97706";
                                                                                                                htmlBtn.style.color = "white";
                                                                                                                        composeBtn.style.background = "#e2e8f0";
                                                                                                                                composeBtn.style.color = "#334155";
                            } else {
                                        label.innerText = "Compose Mode (Normal Text)";
                                                label.style.color = "#003366";
                                                        textArea.placeholder = "Start writing your story here...";
                                                                textArea.style.fontFamily = "sans-serif";
                                                                        textArea.style.background = "#ffffff";
                                                                                textArea.style.color = "#000000";
                                                                                        
                                                                                                // Toggle button highlights
                                                                                                        composeBtn.style.background = "#003366";
                                                                                                                composeBtn.style.color = "white";
                                                                                                                        htmlBtn.style.background = "#e2e8f0";
                                                                                                                                htmlBtn.style.color = "#334155";
                            }
}

// Function to handle submitting the content data log to the array feed list
function publishBloggerPost() {
        const title = document.getElementById('post-title').value.trim();
            const category = document.getElementById('post-category').value.trim();
                let bodyContent = document.getElementById('post-body').value;

                    if (!title || !bodyContent) {
                                alert("Please provide both an article title and content body before publishing.");
                                        return;
                    }

                        // Security Check: If they wrote in Compose mode, convert straight linebreaks to HTML tags <br>
                            if (currentEditorMode === 'compose') {
                                        bodyContent = bodyContent.replace(/\n/g, "<br>");
                            }

                                const newPost = {
                                            id: `post_${Date.now()}`,
                                                    title: title,
                                                            category: category || "General",
                                                                    body: bodyContent, // Holds raw HTML strings perfectly
                                                                            comments: []
                                };

                                    localPosts.unshift(newPost); // Add to top of home community feed arrays
                                        
                                            // Reset Form fields
                                                document.getElementById('post-title').value = '';
                                                    document.getElementById('post-category').value = '';
                                                        document.getElementById('post-body').value = '';
                                                            
                                                                // Return to default compose view look
                                                                    switchEditorMode('compose');
                                                                        
                                                                            // Refresh feed layout live
                                                                                renderCommunityPosts();
                                                                                    alert("Excellent! Your dynamic article has been formatted and published live.");
}
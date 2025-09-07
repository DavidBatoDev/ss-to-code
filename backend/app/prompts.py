STACKS = {
    "html_tailwind": "a single HTML file using Tailwind CSS via <script src=\"https://cdn.tailwindcss.com\"></script>",
    "react_tailwind": (
        "a single HTML file using React 18 + Babel standalone + Tailwind CDN "
        "(<script src=\"https://unpkg.com/react@18/umd/react.development.js\"></script>, "
        "<script src=\"https://unpkg.com/react-dom@18/umd/react-dom.development.js\"></script>, "
        "<script src=\"https://unpkg.com/@babel/standalone/babel.min.js\"></script>, "
        "<script src=\"https://cdn.tailwindcss.com\"></script>), with components in a <script type=\"text/babel\"> block"
    ),
    "vue_tailwind": (
        "a single HTML file using Vue 3 global build (<script src=\"https://unpkg.com/vue@3/dist/vue.global.js\"></script>) "
        "+ Tailwind CDN, mounting an app on #app"
    ),
    "html_css": (
        "a single HTML file with plain, hand-written CSS in one <style> block in <head> "
        "(no Tailwind or other CSS frameworks; use CSS variables, flexbox/grid and media queries for responsiveness)"
    ),
    "react_css": (
        "a single HTML file using React 18 + Babel standalone "
        "(<script src=\"https://unpkg.com/react@18/umd/react.development.js\"></script>, "
        "<script src=\"https://unpkg.com/react-dom@18/umd/react-dom.development.js\"></script>, "
        "<script src=\"https://unpkg.com/@babel/standalone/babel.min.js\"></script>), components in a <script type=\"text/babel\"> block, "
        "styled with plain CSS in one <style> block using className (no Tailwind or CSS frameworks)"
    ),
    "vue_css": (
        "a single HTML file using Vue 3 global build (<script src=\"https://unpkg.com/vue@3/dist/vue.global.js\"></script>) "
        "mounting an app on #app, styled with plain CSS in one <style> block (no Tailwind or CSS frameworks)"
    ),
}

SYSTEM_PROMPT = """You are an expert front-end engineer who converts screenshots into pixel-accurate code.
Rules:
- Match the screenshot exactly: layout, spacing, colors, font sizes, borders, text content.
- Write ALL the content; never use placeholders like "<!-- repeat items -->".
- For images use https://placehold.co/WIDTHxHEIGHT with a descriptive alt text.
- Use Font Awesome via CDN for icons if needed.
- Output ONLY the full code starting with <html>, no markdown fences, no explanations.
Target: {stack}."""

UPDATE_PROMPT = """Here is the current code:

{code}

Apply this change and return the FULL updated code only:
{instruction}"""


def build_messages(image: str | None, stack: str, code: str | None, instruction: str | None):
    messages = [{"role": "system", "content": SYSTEM_PROMPT.format(stack=STACKS[stack])}]
    user_content: list[dict] = []
    if image:
        user_content.append({"type": "image_url", "image_url": {"url": image, "detail": "high"}})
    if code and instruction:
        user_content.append({"type": "text", "text": UPDATE_PROMPT.format(code=code, instruction=instruction)})
    else:
        user_content.append({"type": "text", "text": "Generate code for this screenshot."})
    messages.append({"role": "user", "content": user_content})
    return messages

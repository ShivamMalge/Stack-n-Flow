This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Running Pratyaksha in Google Colab

Pratyaksha is optimized for interactive visualization in Google Colab.

1.  **Open the Demo**: Open `examples/pratyaksha_colab_demo.ipynb` or create a new notebook.
2.  **Install**: Run the following in a cell:
    ```bash
    !pip install git+https://github.com/ShivamMalge/Stack-n-Flow.git
    ```
3.  **Visualize**: Import and use your data structures:
    ```python
    from pratyaksha import Stack
    s = Stack()
    s.push(10) # Animations will trigger automatically.
    ```

## Phase 1 Documentation
For detailed technical information, refer to [documentation.md](documentation.md).

# @codeandcreed/create-titan

A CLI for creating Full-Stack NextJS 15 Applications (Pre-configured with Auth, Database, Payments, Emails, Analytics, and more).

## Installation & Usage
```bash
bun x @codeandcreed/create-titan@latest
```

## Tech Stack

- [NextJS 15](https://nextjs.org/) - Full-Stack React framework
- [Supabase](https://supabase.com/) - Database
- [Clerk](https://clerk.com/) - Authenticate your Users
- [Stripe](https://stripe.com/) - Collect Payments
- [Plunk](https://useplunk.com/) - Send Emails
- [Umami](https://umami.is/) - Analyze User Behavior
- [Vercel](https://vercel.com/) - Deployments

## License

MIT 

## Contributing

Contributions are welcome! Please feel free to submit a PR.

## For Maintainers

Once you've made your changes:

To update the package, make sure you are in the directory `packages/create-titan` and then run `bun version patch` to update the version number.

Then build the package: `bun build`

Then, run `bun publish --no-git-checks` to publish the new version to NPM.

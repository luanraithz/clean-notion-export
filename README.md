# Notion export cleaner

[npm package](https://www.npmjs.com/package/clean-notion-export)

## Running

```
npm install -g clean-notion-export
clean-notion-export --entry ./path/to/folder --output ./my-formatted-notion-stuff

// or
npx clean-notion-export --entry ./path/to/folder --output ./my-formatted-notion-stuff
```

## What it does

* Removes the Guid's from the file title
* Embeds the csv's content into the markdown files

## Disclaimer

I'm kinda mad with notion's export feature, it doesn't export some of the stuff, causing this library to fail, once in a while.


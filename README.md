# Extended Markdown Syntax - Obsidian Plugin

Provides some alternatives for inline formatting using non-standard syntaxes instead of using html tags, such as underline, superscript, and much more.

You can easily create text that is <ins>underlined</ins>, <sup>superscripted</sup>, or <sub>subscripted</sub> without any pain of writing html tags. And don't forget, this plugin supports both modes: editor mode and preview mode.

![formattings.gif](docs/media/formattings.gif)

## Features

- Extends your Markdown with some inline syntax which aren't available in the native Obsidian syntax, including:
    - insertion (underline),
    - Discord-flavored spoiler,
    - Pandoc-style superscript and subscript,
    - custom color tag for highlight, and
    - custom span with ability to insert your own class(es).
- _Modified_ Pandoc-style fenced div syntax for customizing block-level format.
- Uses non-prerendered Markdown preview when formatting such syntax in live-preview mode, gives a more intuitive impression in such a way.
- Be aware of inline and block context, so syntax won't be parsed while it encounters such a codeblock, codespan, or context boundary.
- Quick format with commands and context menu.
- Has an ability to customize the color of the highlight with your own desire through settings.
- Provides color menu for highlight, improves more efficient way to change the color.
- Provides tag menu for custom span and fenced div.
- Toggling specific syntax on and off through the settings.
- Configurable tag display behaviour for the tag of the highlight, custom span, and fenced div.
- Supports parsing exported PDF (can be switched off in the settings).

## Usage

### 1. Inline Formatting

There is four formatting types that currently developed in this plugin: **insertion** (underline), **Discord-flavoured spoiler**, **Pandoc-flavoured superscript and subscript**, custom tag for ==highlight==, and custom span that can be inserted with your own class(es).

| Type        | Syntax                 | Result                                                        |
| ----------- | ---------------------- | ------------------------------------------------------------- |
| insertion   | `++your text++`        | <ins>your text</ins>                                          |
| spoiler     | `\|\|your text\|\|`    | <span style="background: #2e2e2e">your text</span>          |
| superscript | `^your-text^`          | <sup>your-text</sup>                                          |
| subscript   | `~your-text~`          | <sub>your-text</sub>                                          |
| highlight   | `=={color}your text==` | <mark>your text</mark>                                        |
| custom span | `!!{myCls}your text!!` | your text (should be rendered with the `myCls` class defined) |

By default, **insertion** give the text underline style, **spoiler** hide the text and can be revealed by clicking it (or hovering over it in editor mode), while **superscript** and **subscript** make the text being raised or lowered as `<sup>` and `<sub>` do.

The main advantage of using those syntaxes over html tags is that those syntaxes are rendered properly in the editor alongside other built-in syntaxes. So you can combine them without blocking other style being rendered in editor, in stark contrast to the html tags, for instance `this *is ++italic-underlined text++*`.

To give those formats, you can wrap the text with specific delimiters, covering it on both sides (see the table above). Additionally, for the highlight and custom span, you may insert a tag right after the opening delimiter, specifying the color for the highlight, and the classes for the custom span.

For ease access, in the editor, the color button will appear after the opening delimiter when the cursor or selection touches the highlight. Clicking on it shows colors menu and let us choose the desired color (you can disable the color botton in settings, and thus will be hidden in the editor).

> [!Note]
>
> You can use typing-helper plugins such as [Easy Typing](https://github.com/Yaozhuwa/easy-typing-obsidian) to make formatting faster and efficient.

### 2. Block Formatting

Currenty, this plugin only support one type of block syntax, that's Pandoc-style fenced div (with some modifications).

```markdown
::: my-class-1 my-class-2
This is fenced div content.
```

But it has been modified in this plugin to become a way more restricted, avoiding conflict with the built-in syntax. So, you will only need an opening delimiter to start this format in the concerned text (closing delimiter isn't needed). Optionally, you can insert a tag containing your own classes, which then can be styled through the CSS snippet.

For example:

```css
/* Your CSS snippet */
.align-center {
    text-align: center;
}

.medium-size {
    font-size: 24px;
}

.monospace {
    font-family: monospace;
}
```

You can apply those rules above like this.

```markdown
::: align-center medium-size monospace
Center-aligned text
with medium font size and monospace style.
```

> [!Note]
>
> Custom align no longer available in this plugin, because it is already covered by the fenced div.

### 3. Commands and Context Menu

This plugin provides commands to toggle each formatting type on and off, also commands to show the color and tag menu for each of highlight, custom span, and fenced div. You can set the keymap for each of them through "Hotkeys" in the settings.

This plugin also adds functionality of all those commands (except for fenced div) to the context menu, by right-clicking on the editor and choosing "More format" (below "Insert" in the formatting section).

Mimicking how Obsidian formats the text, this plugin brings an ability to do "tidier" formatting. That means that the plugin will try to format the whole word that touches the cursor. So, you don't need to select all over the word. But, if you still want the formatting to behave like normal auto-wrap, you toggle off "Tidier formatting" in the settings.

### 4. Tweaking the Settings

Because some syntax may not be required, or just simply you don't want to use it, this plugin provides ability to turn specific syntax off under the "Syntax switch" section. Also, this plugin give some option to turn those off only in one mode (either editor or preview mode), gives you more freely and flexible choice depend on your needs.

Moreover, the tag display behaviour of the highlight, custom span, and fenced div can be configured through the "Tag display behaviour" section. If you don't want the tag to be hidden, you can set it to "Always visible" in the live-preview mode, or toggle it on in the preview mode.

This plugin provides a way for tweaking the highlight, without exhaustingly bring the CSS snippet into it. In the "Custom highlight" section, you can adjust:
- visibilty of the color button,
- the opacity of the highlight color for each light mode and dark mode, range from 0 to 1 (zero means that the highlight will be fully transparent),
- the list of the color palattes, by adding the new one, changing their color and their tag string, or deleting them,
- also, it is equipped with ability to change the name, arrange, and decide the colors to be displayed in the color menu.

Along with the latest version, you can add some predefined tags to the custom span and fenced div (under the "Custom span" and "Fenced div" sections), so those will be displayed in the tag menu. These features behave like the color palattes in the "Custom highlight", except you have to manually set the style rules within the CSS snippet manually if you want to give each tag some styles.

For the last section, the "Others" section, you can choose:
- whether the delimiter can be escaped by backslash or not (editor only), and
- whether the syntax will be parsed in the exported PDF or not.

> [!Note]
> 
> You don't need to reload the app after changing the settings.

## Syntax Rules

We move the explanation to [this page](./docs/rule.md).

## Installation

- In-app
    - Open settings.
    - Choose "Community plugins" setting tab.
    - Turn off "Restricted mode" if it was enabled before.
    - Click "Browse" at "Community plugins" item.
    - Type "Extended Markdown Syntax" in the search box.
    - Install and enable it.
- Manual
    - Create a folder named `extended-markdown-parser` under `YOUR_VAULT_NAME/.obsidian/plugins`.
    - Place `manifest.json`, `main.js`, and `style.css` from the latest release into the folder.
    - Enable it through the "Community plugin" setting tab.
- Using [BRAT](https://github.com/TfTHacker/obsidian42-brat).

## FAQ's

### Is it working on the table and callout?
Of course it's working on both, except for the fenced div.

### Does the plugin work on large files?
I tested it on a 250kB file and it's still working fine. This plugin also uses parser that implemented simple incremental and partial parsing, so you don't need to worry about facing with large files. But if you still have some issues with it, feel free to inform me what the issues you are struggling with.

### Will it cause conflict with other plugins that concerns extending syntax?
It depends on what character the others use in their syntax.

## Roadmap

- [x] Enable/disable formatting in settings
- [x] Applicable on mobile
- [x] ~~Fixing paragraph alignment bug~~ For now, use fenced div to customize block level format
- [x] Customize highlighting colors
- [ ] Customize formatting styles
- [x] Applying syntax quickly using shortcuts and context menu
- [x] ~~Class suggester~~ Predefined tags for custom span and fenced div
- [ ] ~~More syntax, if necessary~~ *I'll be over here for a while*

## Compatibility Note

This plugin have been tested in the latest version of Obsidian (about 1.7.x - 1.8.x), and haven't been tested yet in the version 1.6.x and below.

## Known Issues

- Delimiter escaping doesn't work in the preview mode.
- Cannot escape spoilers that are inside table cells (in source mode). (**cannot be fixed**)

Feel free to let me know if you find any bugs...

## Credit

Thanks to:
- [Pandoc](https://pandoc.org/MANUAL.html) for the idea of some syntax,
- [CommonMark](https://spec.commonmark.org/) and [Github Flavored Markdown](https://github.github.com/gfm/) for the markdown specification.
- [Discord](https://discord.com/) for the spoiler idea.
- [Superschnizel](https://github.com/Superschnizel/obisdian-fast-text-color) for interactive menu idea,
- [Exaroth](https://github.com/exaroth/mdx_custom_span_class) for custom span idea.
- [Mara-Li](https://github.com/Mara-Li/obsidian-regex-mark) for some code snippets,
- [marcel-goldammer](https://github.com/marcel-goldammer/obsidian-keyword-highlighter),
- [attcoleanderson](https://github.com/mattcoleanderson/obsidian-dynamic-text-concealer)
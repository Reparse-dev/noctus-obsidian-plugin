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
- Pandoc-style fenced div syntax for customizing block-level format.
- Uses non-prerendered Markdown preview when formatting such syntax in live-preview mode, gives a more intuitive impression in such a way.
- Be aware of inline and block context, so syntax won't be parsed while it encounters such a codeblock, codespan, or context boundary.
- Has an ability to customize the color of the highlight with your own desire through settings.
- Provides color menu for highlight, improves more efficient way to change the color.
- Set your own custom class(es) for custom span and fenced div syntax.
- Toggling specific syntax on and off through the settings.
- Configurable tag display behaviour for the tag of the highlight, custom span, and fenced div.
- Supports parsing exported PDF (can be switched off in the settings).

## Usage

### 1. Inline Formatting

There is four formatting types that currently developed in this plugin: **insertion** (underline), **Discord-flavoured spoiler**, **Pandoc-flavoured superscript and subscript**, custom tag for ==highlight==, and custom span that can be inserted with your own class(es).

| Type        | Syntax                 | Result                                                        |
| ----------- | ---------------------- | ------------------------------------------------------------- |
| insertion   | `++your text++`        | <ins>your text</ins>                                          |
| spoiler     | `\|\|your text\|\|`    | <span style="background: #2e2e2e">your text</span>            |
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

Currenty, this plugin only support one type of block syntax, that's Pandoc-style fenced div.

```markdown
::: my-class-1 my-class-2
This is fenced div content.
```

But it has been modified in this plugin to become a way more restricted, avoiding conflict with the built-in syntax. So, you will only need an opening delimiter to start this format in the concerned text. Optionally, you can insert a tag containing your own classes, which then can be styled through the CSS snippet.

> [!Note]
>
> Custom align no longer available in this plugin, because it is already covered by the fenced div.

### 3. Altering the Settings

Because some syntax may not be required, or just simply you don't want to use it, this plugin provides ability to turn specific syntax off. Also, this plugin give some option to turn those off only in one mode (either editor or preview mode), gives you more freely and flexible choice depend on your needs.

Moreover, the tag display behaviour of the highlight, custom span, and fenced div can be configured through the "Tag display behaviour" section. If you don't want the tag to be hidden, you can set it to "Always visible" in the live-preview mode, or toggle it on in the preview mode.

Along with the latest version, this plugin provides a way for tweaking the custom highlight, without exhaustingly bring the CSS snippet into it. In the "Customize highlight" section, you can adjust:
- visibilty of the color button,
- the opacity of the highlight color for each light mode and dark mode, range from 0 to 1 (zero means that the highlight will be fully transparent),
- the list of the custom colors, by adding the new one, changing their color and their tag string, or deleting them,  - - also, it is equipped with ability to change the name, arrange, and decide the colors to be displayed in the color menu.

For the last section, the "Others" section, you can choose:
- whether the delimiter can be escaped by backslash or not (editor only), and
- whether the syntax will be parsed in the exported PDF or not.

> [!Note]
> 
> You don't need to reload the app after changing the settings.

## Syntax Rules

To make clear and avoid ambiguity, some rules are applied to the syntax.

#### 1. General Rules for All Syntax

- Any built-in syntax from Obsidian has a higher precedence than that in this plugin.

#### 2. General Rules for Inline Syntax (Insertion, Spoiler, Superscript, Subscript, Highlight Color Tag, Custom Span)

- Opening delimiter must not be followed by any whitespace character (regular space, tab, and new line), and the closing one must not be preceded by any whitespace character.
- Delimiter must satisfy its requiered length as will be explained later, and must not be preceded or followed by the same character as the delimiter, or the same non-escaped if configured for that.
- (Editor only, can be altered through the settings) Delimiter must not be escaped, if it was configured to not be escaped, by a backslash. Otherwise, it will act as literal character.
- Formatting only occurs when opening delimiter met its closing (doesn't include highlight).
- Content text, that is surrounded by delimiters, must at least one character.
- Content text must not have two or more new line character.

For better understanding, the table below can give some example applying those rules:

| Valid                                              | Invalid                                    |
| -------------------------------------------------- | ------------------------------------------ |
| `++lorem++`                                        | `++ lorem++` `++lorem` `lorem++`           |
| `++lor em++`                                       | `++lorem ++`                               |
| `++l++`                                            | `++++`                                     |
| `++l+o+r+em++`                                     | `++dfdf+++`                                |
| `++lo++rem++` (third plus pair doesn't include)    | `++lo\nre\nm++` (`\n` as a new line char)  |
| `++lo\nr   e  m++`                                 | `+++lore++m+++`                            |
| `++ lor++em++` (first one doesn't include)         | `++ ++`                                    |
| `\+++lorem++ ++ipsum\+++` (if escaping is enabled) | `\++lorem++ +\++ipsum\++++`                |

#### 3. Rules for Insertion and Spoiler

- Insertion is defined as text consist at least one character surrounded by exactly double plus signs (`++`) on each side.
- Spoiler is the same as the insertion, it's just surrounded by exactly double bars (`||`) on each side.

| Valid format                             | Invalid format                                                     |
| ---------------------------------------- | ------------------------------------------------------------------ |
| `++ins++` `++ins also++`                 | `++ not ins++`, `++not ins` `++not ins ++` `+++not ins++`          |
| `\|\|spoiler\|\|` `\|\|spoiler also\|\|` | `\|\| not spoiler\|\|`, `\|\|not spoiler \|\|` `\|\|not spoiler\|` |

#### 4. Rules for Superscript and Subscript

- Superscript is defined as text consist at least one character surrounded by only single caret (`^`) on each side, and must not contain any of whitespace character.
- Subscript act like superscript, it's just use single tilde as delimiter.
- Thus, insertion and spoiler allow its content to have any whitespace character. It's contasts with the case of superscript and subscript.

| Valid format         | Invalid format                                                  |
| -------------------- | --------------------------------------------------------------- |
| `^sup^` `^sup-also^` | `^ not-sup^`, `^not sup^`, `^not-sup` `^not-sup ^` `^^not-sup^` |
| `~sub~` `~sub-also~` | `~ not-sub~`, `~not sub~`, `~not-sub` `~not-sub ~` `~not-sub~~` |

#### 5. Rules for Custom Span

- Custom span use the same rules as insertion and spoiler, except it uses double exclamation marks on each side to wrap its content.
- It also comes with a tag you can insert a class or classes into. The tag consists alphanumeric character(s), hyphen(s), and space(s) (at least one character), wrapped by curly brackets on each side. A space is treated as a devider between classes. Other character inserted before or within the tag will disable it, so it will be stated as invalid tag.

| Valid tag                 | Invalid tag                                                 |
| ------------------------- | ----------------------------------------------------------- |
| `!!{my-class}span!!`      | `!! {class}not span!!`, `!!a{class}span!!`                  |
| `!!{class-1 cls-2}span!!` | `!!{}span!!,`  `!!{*_}not span !!`, `!!{green_color}span!!` |

Later on, you can add corresponding class in your CSS snippet. For instance, if you type `!!{my-class strong-text}My text!!`, it will be rendered in HTML as `<span class="my-class strong-text">My text</span>` (with additional `cm-custom-span` class in the editor, and `custom-span` in the preview).

#### 6. Rules for Highlight Color Tag

The color of each highlight can be customized by adding color tag exactly after its opening delimiter. The tag behaves like the custom span tag, except it doesn't allow any space within it.

| Valid color tag            | Invalid color tag                                                     |
| -------------------------- | --------------------------------------------------------------------- |
| `=={color}highlight==`     | `== {color}highlight==`, `==a{color}highlight==`                      |
| `=={abcAb--10}highlight==` | `=={ }highlight==,` `=={*_}highlight==`, `=={green_color}highlight==` |

Valid color tag will be added in the highlight classes, so `=={red}Red==` will be parsed in html tag as **`<span class="cm-custom-highlight cm-custom-highlight-red">`** in editor and **`<mark class="custom-highlight custom-highlight-red">`** in preview mode.

#### 7. NOTE: Delimiter Escaping

As already explained, using escaper backslash can change the semantic meaning to that being escaped. Escaped punctuation is treated as regular character that doesn't have functional use. This applies to those delimiters when "Delimiter escaping" option is switched on.

```
++insertion++ \++not insertion\++ in editor mode
```

However, we can only apply this feature in editor mode, since escaped character being rendered as normal character without being wrapped by any tag (and it makes sense).

```
++insertion++ \++still insertion\++ \+\+still insertion\+\+, \+++not insertion+\++ in preview mode
```

Due to this condition, "Delimiter escaping" was turned of by default to maintain consistency between editor and preview mode.

#### 8. Pandoc-style Fenced Div

Since the align tag has been removed, as it is not as flexible as though, I decided to bring the plugin with Pandoc-style fenced div, which more flexible and intuitive for block customizing. Even though it is Pandoc-style, the implemented rule in this plugin is more restricted to avoid unnecessary broken layout and conflicts (or even worse).

- Fenced div must be opened by a line consists of three or more colons (`:::`), at must be located exactly in the line start.
- The colons may, and only, be followed by tag that consists of alphanumeric, hyphen, and space (can be empty).
- Other characters aren't allowed in the opening line. Even a colon that was inserted in the tag range will make the format invalid.
- It is only be closed by different context (e.g. list, blockquote), blank line, or the end of the document.
- You don't need to close the format with any delimiter.

```
:::
valid fenced div

::: my-class
also valid

:::my-class other-class
also
valid
```

#### 9. Context-aware Formatting

Any syntax that are written in the codespan, codeblock, math, comment, and wikilink don't apply the rules, so they are treated according to their context. Or, in the nutshell, they aren't formatted. This corresponds to the many of markdown implementation, as well as that implemented in Obsidian.

In addition in the editor, any formatting above doesn't overlapping its block context. So if a opening delimiter, i.e. double plus signs for insertion, was found in heading, and didn't meet any double plus signs but in the next line (which is paragraph for instance), then the second delimiter isn't treated as a closing for that opening.

Example below can give some better understanding:

Markdown:
> ```
> # Heading ++1
> The paragraph.++
> 
> Another ++paragraph
> > Blockquote++
> 
> 1. ++List
> 2. another list++
> 3. another ++list
> lazy continuation++
> ```

Expected result:
> <h1>Heading ++1</h1>
> The paragraph.++
> 
> Another ++paragraph
> <blockquote>Blockquote++</blockquote>
> 
> <ol><li>++List</li>
> <li>another list++</li>
> <li>another <ins>list
> <br>lazy continuation</ins></li></ol>

## Installation

- In-app
    - Open settings.
    - Choose "Community plugins" setting tab.
    - Turn off "Restricted mode" if it was enabled before.
    - Click "Browse" at "Community plugins" item.
    - Type "Extended Markdown Syntax" in the search box.
    - Install and enable it.
- Manual
    - Create a folder named `extended-markdown-parser` under `.obsidian/plugins`.
    - Place `manifest.json`, `main.js`, and `style.css` from the latest release into the folder.
    - Enable it through the "Community plugin" setting tab.
- Using [BRAT](https://github.com/TfTHacker/obsidian42-brat).

---

## FAQ's

### Is it working on the table and callout?
Of course it's working on both, except for the fenced div.

### Does the plugin work on large files?
I tested it on a 250kB file and it's still working fine. This plugin also uses parser that implemented simple incremental and partial parsing, so you don't need to worry about facing with large files. But if you still have some issues with it, feel free to inform me what the issues you are struggling with.

### Will it cause conflict with other plugins that concerns extending syntax?
It depends on what character the others use in their syntax.

## Features to be Implemented in The Future

- [x] Enable/disable formatting in settings
- [x] Applicable on mobile
- [x] ~~Fixing paragraph alignment bug~~ For now, use fenced div to customize block level format
- [x] Customize highlighting colors
- [ ] Customize formatting styles
- [ ] Applying syntax quickly using shortcuts and context menu
- [ ] Class suggester for custom span and fenced div
- [ ] ~~More syntax, if necessary~~ *I'll be over here for a while*

## Compatibility Note

This plugin have been tested in the latest version of Obsidian (about 1.7.x - 1.8.x), and haven't been tested yet in the version 1.6.x and below.

## Known Issues

- Delimiter escaping doesn't work in the preview mode.
- Cannot escape spoilers that are inside table cells (in source mode). (**cannot be fixed**)
- ~~Sometimes, faster scrolling on a big file (by using scroll bar thumbs and moving it suddenly to the bottom) breaks the customized highlight color. (*can be fixed temporarily by scrolling with fair speed through the highlight*)~~ _Already fixed_

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
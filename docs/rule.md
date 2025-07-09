## Syntax Rules for Noctus-flavored Markdown (Obsidian Adapted)

To make clear and avoid ambiguity, some rules are applied to the syntax.

#### 1. General Rules for All Syntax

- Any built-in syntax from Obsidian has a higher precedence than that in this plugin.

#### 2. General Rules for Inline Syntax (Insertion, Underline, Spoiler, Superscript, Subscript, Highlight Color Tag, Custom Span)

- Opening delimiter must not be followed by any whitespace character (regular space, tab, and new line), and the closing one must not be preceded by any whitespace character.
- Delimiter must satisfy its requiered length as explained later. It must not be preceded or followed by the same character as the delimiter, or the same non-escaped if configured for that.
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

#### 3. Rules for Insertion, Underline, and Spoiler

- Insertion is defined as text that consist of at least one character surrounded by exactly two plus signs (`++`) on each side.
- Underline is the same as the insertion, but it's surrounded by one equal sign (`=`) on each side.
- Spoiler is the same as the insertion, but it's surrounded by two bars (`||`) on each side.

| Valid format                             | Invalid format                                                     |
| ---------------------------------------- | ------------------------------------------------------------------ |
| `++ins++` `++ins also++`                 | `++ not ins++`, `++not ins` `++not ins ++` `+++not ins++`          |
| `=underline=` `=underline also=`         | `++ not ins++`, `++not ins` `++not ins ++` `+++not ins++`          |
| `\|\|spoiler\|\|` `\|\|spoiler also\|\|` | `\|\| not spoiler\|\|`, `\|\|not spoiler \|\|` `\|\|not spoiler\|` |

#### 4. Rules for Superscript and Subscript

- Superscript is defined as text consist at least one character surrounded by only single caret (`^`) on each side.
- Subscript act like superscript, it's just use single tilde as delimiter.
- Thus, insertion and spoiler allow its content to have any whitespace character. It's contasts with the case of superscript and subscript.

| Valid format                      | Invalid format                                     |
| --------------------------------- | -------------------------------------------------- |
| `^sup^` `^sup-also^` `^sup also^` | `^ not-sup^`, `^not-sup` `^not-sup ^` `^^not-sup^` |
| `~sub~` `~sub-also~` `~sub also~` | `~ not-sub~`, `~not-sub` `~not-sub ~` `~not-sub~~` |

#### 5. Rules for Custom Span

- Custom span use the same rules as insertion and spoiler, except it uses the angle brackets (`<` and `>`) to wrap its content. (Currently not implemented, thus one exclamation marks on each side to wrap its content)
- It also comes with attributes that are contained in curly brackets, in which you can insert classes and general HTML properties (planned). The content of the curly bracket must consist of alphanumeric character(s), hyphen(s), and space(s) (at least one character). A space is treated as a devider between classes & attributes. Other character inserted before or within the brackets will disable it, so it will be stated as invalid tag.

| Valid attributes                           | Invalid attributes                                                                  |
| ------------------------------------------ | ----------------------------------------------------------------------------------- |
| `<{class-1 class-2}span>` `<{class}span>`  | `< {class}not span>`, `<a{class}span>`                                              |
| `<span{class-1 class-2}>` `<span{class}>`  | `<{}span >,`  `<{*_}not span>`, `<{green_color}span>`                               |
| `<span{attribute=value}>` `<span{.class}>` | `<{. class}span>,`  `<{attribute =value}not span>`, `<{attribute = value}not span>` |

Later on, you can add corresponding class in your CSS snippet. For instance, if you type `!!{my-class strong-text}My text!!`, it will be rendered in HTML as `<span class="my-class strong-text">My text</span>` (with additional `cm-custom-span` class in the editor, and `custom-span` in the preview).

#### 6. Rules for Highlight Color Tag

The color of each highlight can be customized by adding color attribute exactly after its opening delimiter. The color attribute behaves like the custom span attribute, except it doesn't allow any space within it, only allowing to specify one color.

| Valid color attribute      | Invalid color attribute                                               |
| -------------------------- | --------------------------------------------------------------------- |
| `=={color}highlight==`     | `== {color}highlight==`, `==a{color}highlight==`                      |
| `=={abcAb--10}highlight==` | `=={ }highlight==,` `=={*_}highlight==`, `=={green_color}highlight==` |

Valid color tag will be added in the highlight classes, so `=={red}Red==` will be parsed in html tag as **`<span class="cm-custom-highlight cm-custom-highlight-red">`** in editor and **`<mark class="custom-highlight custom-highlight-red">`** in preview mode.

#### 7. Subtext - The Exception

Subtext works differently to all the other inline syntax as it only has a starting delimiter (`-#`) and affects everything until the end of the block element it was started in.

| Valid Subtext            | Invalid Subtext           |
| `-#Subtext` `-# Subtext` | `- #Subtext` `- # Subtext`|

#### 8. NOTE: Delimiter Escaping

As already explained, using escaper backslash can change the semantic meaning to that being escaped. Escaped punctuation is treated as regular character that doesn't have functional use. This applies to those delimiters when "Delimiter escaping" option is switched on.

```
++insertion++ \++not insertion\++ in editor mode
```

However, we can only apply this feature in editor mode, since escaped character being rendered as normal character without being wrapped by any tag (and it makes sense).

```
++insertion++ \++still insertion\++ \+\+still insertion\+\+, \+++not insertion+\++ in preview mode
```

Due to this condition, "Delimiter escaping" was turned of by default to maintain consistency between editor and preview mode.

#### 8. Modified Pandoc-style Fenced Div

Since the align tag has been removed, as it is not as flexible as though, I decided to bring the plugin with Pandoc-style fenced div, which more flexible and intuitive for block customizing. Even though it is Pandoc-style, the implemented rule in this plugin is more restricted to avoid unnecessary broken layout and conflicts (or even worse).

- Fenced div must be opened by a line consists of three or more colons (`:::`), at must be located exactly in the line start.
- The colons may, and only, be followed by tag that consists of alphanumeric, hyphen, and space (can be empty).
- Other characters aren't allowed in the opening line. Even a colon that was inserted in the tag range will make the format invalid.
- It is only be closed by different context (e.g. list, blockquote), blank line, or the end of the document. Therefore, closing the div with colons doesn't have any effect.
- You don't need to close the format with any delimiter.

```
:::
valid fenced div

::: class
also valid

:::class-1 class-2
also
valid
```

#### 9. Context-aware Formatting

Any syntax that is written in the codespan, codeblock, math, comment, and wikilink won't have the rules applied, so they are treated according to their context. Or, in the nutshell, they aren't formatted. This corresponds to the many of markdown implementation, as well as that implemented in Obsidian.

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
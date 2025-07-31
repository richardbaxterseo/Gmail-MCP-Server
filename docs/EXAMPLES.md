# Gmail MCP Usage Examples

## Basic Operations

### Search Emails

```javascript
// Simple search
await gmail.search_emails({
  query: "from:newsletter@example.com"
});

// Complex search with date range
await gmail.search_emails({
  query: "subject:invoice has:attachment after:2024/01/01 before:2024/12/31",
  maxResults: 50
});

// Search with labels
await gmail.search_emails({
  query: "label:important is:unread"
});
```

### Read Email Content

```javascript
// Read specific email
await gmail.read_email({
  messageId: "18abc123def456789"
});

// Read full thread
await gmail.read_thread({
  threadId: "18abc123def456789",
  includeFullMessages: true
});
```

## Advanced Use Cases### Tax Invoice Processing

```javascript
// Search for tax-relevant invoices
const taxInvoices = await gmail.search_emails({
  query: "(subject:invoice OR subject:receipt) has:attachment after:2024/04/01 before:2025/03/31"
});

// Process each invoice
for (const invoice of taxInvoices.messages) {
  const details = await gmail.read_email({
    messageId: invoice.id
  });
  
  // Extract attachment info
  const attachments = extractAttachments(details);
  
  // Download PDFs
  for (const attachment of attachments) {
    await gmail.download_attachment({
      messageId: invoice.id,
      attachmentId: attachment.id,
      savePath: "./tax-receipts/",
      filename: attachment.filename
    });
  }
}
```

### Email Automation

```javascript
// Auto-archive old emails
const oldEmails = await gmail.search_emails({
  query: "older_than:6m -label:important"
});// Batch archive
await gmail.batch_modify_emails({
  messageIds: oldEmails.messages.map(m => m.id),
  removeLabelIds: ["INBOX"],
  addLabelIds: ["ARCHIVE"]
});

// Create and apply custom label
const label = await gmail.create_label({
  name: "Processed/2024"
});

await gmail.batch_modify_emails({
  messageIds: processedIds,
  addLabelIds: [label.id]
});
```

### Newsletter Management

```javascript
// Find all newsletters
const newsletters = await gmail.search_emails({
  query: "unsubscribe OR list-unsubscribe"
});

// Group by sender
const senderGroups = groupBySender(newsletters.messages);

// Create labels for each sender
for (const [sender, messages] of Object.entries(senderGroups)) {
  const label = await gmail.get_or_create_label({
    name: `Newsletters/${sender}`
  });
    await gmail.batch_modify_emails({
    messageIds: messages.map(m => m.id),
    addLabelIds: [label.id]
  });
}
```

## Integration Examples

### With Desktop Commander MCP

```javascript
// Download attachments and process with Desktop Commander
const invoices = await gmail.search_emails({
  query: "has:attachment filename:pdf"
});

for (const message of invoices.messages) {
  // Download via Gmail MCP
  const downloaded = await gmail.download_attachment({
    messageId: message.id,
    attachmentId: attachmentId,
    savePath: "C:/invoices/"
  });
  
  // Process with Desktop Commander
  await desktopCommander.read_file({
    path: downloaded.filepath
  });
}
```

### With Nova Memory MCP

```javascript
// Store email insights in Nova
const emails = await gmail.search_emails({  query: "from:important-client@example.com"
});

for (const message of emails.messages) {
  const content = await gmail.read_email({
    messageId: message.id
  });
  
  // Store in Nova Memory
  await nova.memory({
    action: "store",
    content: `Email from ${content.from}: ${content.subject}`,
    memory_type: "observation",
    structured: {
      entities: ["Email", content.from, content.subject],
      relationships: [{
        subject: "Client",
        relation: "sent",
        object: "Email"
      }]
    }
  });
}
```

## Error Handling

```javascript
try {
  const result = await gmail.search_emails({
    query: "subject:urgent"
  });
} catch (error) {
  if (error.code === 429) {
    // Rate limit - implement backoff
    await sleep(exponentialBackoff());
  } else if (error.code === 401) {    // Auth error - refresh token
    await refreshAuthentication();
  }
}
```

## Performance Tips

1. **Batch Operations**
   - Use batch_modify for multiple emails
   - Process in chunks of 50-100

2. **Search Optimization**
   - Use specific date ranges
   - Include labels to narrow results
   - Limit results with maxResults

3. **Caching Strategy**
   - Cache frequently accessed labels
   - Store message IDs for follow-up
   - Implement local search index

## Common Patterns

### Weekly Summary
```javascript
const thisWeek = await gmail.search_emails({
  query: "newer_than:7d",
  maxResults: 100
});

const summary = {
  total: thisWeek.resultSizeEstimate,
  byLabel: groupByLabel(thisWeek.messages),
  important: thisWeek.messages.filter(m => m.labelIds.includes("IMPORTANT"))
};
```
# 💰 Payment Integration Plan - Skillswap

> **Status**: 🔮 Geplant für spätere Phase
> **Priorität**: Medium (nach Core Features)
> **Geschätzte Dauer**: 3-4 Arbeitstage
> **Letzte Aktualisierung**: 01.10.2025

---

## 🎯 Ziel

Integration eines **Escrow-Payment-Systems** für monetäre Skill-Exchanges. Nutzer können Skills gegen Bezahlung anbieten, wobei Zahlungen erst nach erfolgreicher Appointment-Durchführung freigegeben werden.

---

## 🏗️ Architektur-Übersicht

### Payment Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      PAYMENT LIFECYCLE                          │
└─────────────────────────────────────────────────────────────────┘

1. MATCH REQUEST (mit isMonetary=true)
   ↓
   User A sendet Match Request:
   {
     skillId: "...",
     targetUserId: "...",
     isMonetary: true,
     offeredAmount: 50.00,
     currency: "EUR"
   }

2. MATCH ACCEPT
   ↓
   MatchmakingService → PaymentService
   └─> CreatePaymentIntent(50€, capture_method="manual")
   └─> PaymentIntent ID gespeichert in Match

3. APPOINTMENT CREATED
   ↓
   Appointments haben Reference zu PaymentIntent
   Status: "Pending" → Funds werden GEHALTEN (nicht eingezogen)

4. APPOINTMENT COMPLETED
   ↓
   User markiert Appointment als "Completed"
   └─> PaymentService.CapturePayment(paymentIntentId)
   └─> Geld wird an Teacher freigegeben
   └─> Status: "Captured"

5. PAYOUT (automatisch)
   ↓
   Nach 7 Tagen: Automatic Payout zu Bank Account
   └─> Stripe Dashboard: Payout Schedule

6. DISPUTE HANDLING (Optional)
   ↓
   Bei Problemen innerhalb 14 Tagen:
   └─> Admin Review
   └─> Refund oder Capture basierend auf Entscheidung
```

---

## 🛠️ Technologie-Stack

### Payment Provider: **Stripe**

**Warum Stripe?**
- ✅ Beste Developer Experience (React Components, TypeScript Support)
- ✅ EU-optimiert (SEPA, IBAN, lokale Zahlungsmethoden)
- ✅ Niedrige Gebühren: 1.5% + €0.25 pro Transaktion
- ✅ Built-in Escrow via PaymentIntents mit `capture_method=manual`
- ✅ Dispute Management inklusive
- ✅ PCI-DSS compliant (keine eigene Security-Implementierung nötig)
- ✅ Connect für Auszahlungen an Nutzer

**Alternativen:**
- PayPal: Höhere Fees (2.49% + €0.35), schlechtere API
- Adyen: Enterprise-focused, zu komplex für MVP
- Mollie: Nur EU, weniger Features

---

## 📦 Implementierung

### 1. Backend: PaymentService (Neuer Microservice)

```
src/services/PaymentService/
├── Application/
│   ├── Commands/
│   │   ├── CreatePaymentIntentCommand.cs
│   │   ├── CapturePaymentCommand.cs
│   │   ├── RefundPaymentCommand.cs
│   │   └── CreatePayoutCommand.cs
│   ├── Queries/
│   │   ├── GetPaymentStatusQuery.cs
│   │   ├── GetUserBalanceQuery.cs
│   │   └── GetTransactionHistoryQuery.cs
│   └── Handlers/
│       ├── CreatePaymentIntentCommandHandler.cs
│       ├── CapturePaymentCommandHandler.cs
│       └── RefundPaymentCommandHandler.cs
├── Domain/
│   └── Entities/
│       ├── Payment.cs
│       ├── Transaction.cs
│       ├── PaymentIntent.cs
│       └── Payout.cs
├── Infrastructure/
│   ├── Stripe/
│   │   ├── StripeService.cs
│   │   ├── StripeWebhookHandler.cs
│   │   └── StripeConfiguration.cs
│   └── Repositories/
│       └── PaymentRepository.cs
├── Consumer/
│   ├── MatchAcceptedConsumer.cs
│   ├── AppointmentCompletedConsumer.cs
│   ├── AppointmentCancelledConsumer.cs
│   └── DisputeOpenedConsumer.cs
└── Controllers/
    ├── PaymentsController.cs
    └── WebhooksController.cs
```

### 2. Domain Models

```csharp
// Payment.cs
public class Payment
{
    public string Id { get; set; }
    public string StripePaymentIntentId { get; set; }
    public string MatchId { get; set; }
    public string PayerId { get; set; } // Student
    public string RecipientId { get; set; } // Teacher
    public decimal Amount { get; set; }
    public string Currency { get; set; }
    public PaymentStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? CapturedAt { get; set; }
    public DateTime? RefundedAt { get; set; }
    public string? DisputeReason { get; set; }
}

public enum PaymentStatus
{
    Created,        // PaymentIntent created
    Authorized,     // Funds authorized (held)
    Captured,       // Payment completed
    Refunded,       // Money returned
    Failed,         // Payment failed
    Disputed        // Dispute opened
}
```

### 3. Stripe Service Implementation

```csharp
// Infrastructure/Stripe/StripeService.cs
public class StripeService : IPaymentService
{
    private readonly StripeClient _stripeClient;
    private readonly ILogger<StripeService> _logger;

    public async Task<PaymentIntent> CreatePaymentIntentAsync(
        decimal amount,
        string currency,
        string customerId,
        Dictionary<string, string> metadata)
    {
        var options = new PaymentIntentCreateOptions
        {
            Amount = (long)(amount * 100), // Stripe uses cents
            Currency = currency.ToLower(),
            Customer = customerId,
            CaptureMethod = "manual", // ⚠️ WICHTIG: Escrow!
            Metadata = metadata,
            AutomaticPaymentMethods = new PaymentIntentAutomaticPaymentMethodsOptions
            {
                Enabled = true,
            },
        };

        var service = new PaymentIntentService();
        return await service.CreateAsync(options);
    }

    public async Task<PaymentIntent> CapturePaymentAsync(string paymentIntentId)
    {
        var service = new PaymentIntentService();
        return await service.CaptureAsync(paymentIntentId);
    }

    public async Task<Refund> RefundPaymentAsync(string paymentIntentId, decimal? amount = null)
    {
        var refundOptions = new RefundCreateOptions
        {
            PaymentIntent = paymentIntentId,
        };

        if (amount.HasValue)
        {
            refundOptions.Amount = (long)(amount.Value * 100);
        }

        var service = new RefundService();
        return await service.CreateAsync(refundOptions);
    }
}
```

### 4. Consumer: MatchAcceptedConsumer

```csharp
// PaymentService/Consumer/MatchAcceptedConsumer.cs
public class MatchAcceptedConsumer : IConsumer<MatchAcceptedIntegrationEvent>
{
    private readonly IPaymentService _paymentService;
    private readonly ILogger<MatchAcceptedConsumer> _logger;

    public async Task Consume(ConsumeContext<MatchAcceptedIntegrationEvent> context)
    {
        var evt = context.Message;

        // Nur wenn monetär
        if (!evt.IsMonetary)
            return;

        _logger.LogInformation(
            "Creating payment intent for match {MatchId}: {Amount} {Currency}",
            evt.MatchId, evt.AgreedAmount, evt.Currency);

        // Create PaymentIntent (Escrow)
        var paymentIntent = await _paymentService.CreatePaymentIntentAsync(
            amount: evt.AgreedAmount ?? 0,
            currency: evt.Currency ?? "EUR",
            customerId: evt.RequesterId, // Payer
            metadata: new Dictionary<string, string>
            {
                ["matchId"] = evt.MatchId,
                ["requesterId"] = evt.RequesterId,
                ["targetUserId"] = evt.TargetUserId,
                ["skillId"] = evt.SkillId
            });

        // Speichern in DB
        var payment = new Payment
        {
            Id = Guid.NewGuid().ToString(),
            StripePaymentIntentId = paymentIntent.Id,
            MatchId = evt.MatchId,
            PayerId = evt.RequesterId,
            RecipientId = evt.TargetUserId,
            Amount = evt.AgreedAmount ?? 0,
            Currency = evt.Currency ?? "EUR",
            Status = PaymentStatus.Created,
            CreatedAt = DateTime.UtcNow
        };

        await _paymentRepository.AddAsync(payment);
        await _paymentRepository.SaveChangesAsync();

        _logger.LogInformation(
            "Payment intent {PaymentIntentId} created for match {MatchId}",
            paymentIntent.Id, evt.MatchId);
    }
}
```

### 5. Consumer: AppointmentCompletedConsumer

```csharp
// PaymentService/Consumer/AppointmentCompletedConsumer.cs
public class AppointmentCompletedConsumer : IConsumer<AppointmentCompletedIntegrationEvent>
{
    public async Task Consume(ConsumeContext<AppointmentCompletedIntegrationEvent> context)
    {
        var evt = context.Message;

        // Hole Payment via MatchId
        var payment = await _paymentRepository.GetByMatchIdAsync(evt.MatchId);

        if (payment == null || payment.Status != PaymentStatus.Authorized)
            return;

        _logger.LogInformation(
            "Capturing payment {PaymentId} for completed appointment {AppointmentId}",
            payment.Id, evt.AppointmentId);

        // Capture Payment (Geld freigeben)
        await _paymentService.CapturePaymentAsync(payment.StripePaymentIntentId);

        payment.Status = PaymentStatus.Captured;
        payment.CapturedAt = DateTime.UtcNow;
        await _paymentRepository.SaveChangesAsync();

        // Event für Notification
        await _publishEndpoint.Publish(new PaymentCapturedIntegrationEvent(
            payment.Id,
            payment.MatchId,
            payment.Amount,
            payment.Currency));
    }
}
```

---

## 🎨 Frontend Integration

### 1. Stripe Elements für Payment UI

```typescript
// src/client/src/components/payment/PaymentForm.tsx
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY!);

export const PaymentForm: React.FC<{ clientSecret: string }> = ({ clientSecret }) => {
  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <PaymentFormInner />
    </Elements>
  );
};

const PaymentFormInner: React.FC = () => {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    // Authorize payment (nicht sofort einziehen!)
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment-success`,
      },
    });

    if (error) {
      toast.error(error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <Button type="submit" disabled={!stripe}>
        Authorize Payment
      </Button>
      <Typography variant="caption">
        Payment wird erst nach Appointment-Durchführung eingezogen
      </Typography>
    </form>
  );
};
```

### 2. Match Request mit Payment Option

```typescript
// src/client/src/components/matchmaking/MatchRequestForm.tsx
const [isMonetary, setIsMonetary] = useState(false);
const [amount, setAmount] = useState(0);

<FormControlLabel
  control={
    <Switch
      checked={isMonetary}
      onChange={(e) => setIsMonetary(e.target.checked)}
    />
  }
  label="Monetary Exchange"
/>

{isMonetary && (
  <TextField
    label="Amount"
    type="number"
    value={amount}
    onChange={(e) => setAmount(Number(e.target.value))}
    InputProps={{
      startAdornment: <InputAdornment position="start">€</InputAdornment>,
    }}
  />
)}
```

### 3. Payment Status Display

```typescript
// src/client/src/components/appointments/AppointmentCard.tsx
{appointment.payment && (
  <Chip
    label={`Payment: ${appointment.payment.status}`}
    color={
      appointment.payment.status === 'Captured' ? 'success' :
      appointment.payment.status === 'Authorized' ? 'warning' :
      'default'
    }
  />
)}
```

---

## 🔐 Security Considerations

### 1. Webhook Signature Verification

```csharp
// PaymentService/Controllers/WebhooksController.cs
[HttpPost("stripe")]
public async Task<IActionResult> StripeWebhook()
{
    var json = await new StreamReader(HttpContext.Request.Body).ReadToEndAsync();
    var signatureHeader = Request.Headers["Stripe-Signature"];

    try
    {
        var stripeEvent = EventUtility.ConstructEvent(
            json,
            signatureHeader,
            _stripeWebhookSecret);

        // Handle event
        switch (stripeEvent.Type)
        {
            case Events.PaymentIntentSucceeded:
                var paymentIntent = stripeEvent.Data.Object as PaymentIntent;
                await HandlePaymentIntentSucceeded(paymentIntent);
                break;

            case Events.ChargeRefunded:
                var charge = stripeEvent.Data.Object as Charge;
                await HandleChargeRefunded(charge);
                break;
        }

        return Ok();
    }
    catch (StripeException)
    {
        return BadRequest();
    }
}
```

### 2. PCI Compliance

- ✅ **KEINE Kreditkarten-Daten** in eigener DB speichern
- ✅ Stripe Elements nutzt Stripe-hosted Forms (PCI-compliant)
- ✅ Tokens statt Raw Card Data
- ✅ HTTPS für alle Payment-Requests

---

## 💶 Kosten & Fees

### Stripe Pricing (EU)

| Transaction Type | Fee |
|-----------------|-----|
| **Standard** | 1.5% + €0.25 |
| **SEPA Direct Debit** | 0.8% (max €5) |
| **International Cards** | 2.9% + €0.25 |

### Beispiel-Rechnung

```
Skill-Exchange: €50
├─ Stripe Fee: €1.00 (1.5% + €0.25)
├─ Platform Fee: €2.50 (5% - optional)
└─ Teacher Payout: €46.50
```

**Kostenlos für:**
- Setup & Integration
- Test-Transaktionen
- Webhook-Handling
- Dashboard-Nutzung

---

## 📊 Database Schema

```sql
CREATE TABLE Payments (
    Id VARCHAR(36) PRIMARY KEY,
    StripePaymentIntentId VARCHAR(255) NOT NULL UNIQUE,
    MatchId VARCHAR(36) NOT NULL,
    PayerId VARCHAR(36) NOT NULL,
    RecipientId VARCHAR(36) NOT NULL,
    Amount DECIMAL(10,2) NOT NULL,
    Currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
    Status VARCHAR(20) NOT NULL,
    CreatedAt DATETIME NOT NULL,
    AuthorizedAt DATETIME,
    CapturedAt DATETIME,
    RefundedAt DATETIME,
    DisputeReason TEXT,
    INDEX idx_match_id (MatchId),
    INDEX idx_status (Status),
    INDEX idx_payer (PayerId),
    INDEX idx_recipient (RecipientId)
);

CREATE TABLE Transactions (
    Id VARCHAR(36) PRIMARY KEY,
    PaymentId VARCHAR(36) NOT NULL,
    Type VARCHAR(20) NOT NULL, -- 'Charge', 'Refund', 'Payout'
    Amount DECIMAL(10,2) NOT NULL,
    StripeTransactionId VARCHAR(255),
    CreatedAt DATETIME NOT NULL,
    FOREIGN KEY (PaymentId) REFERENCES Payments(Id)
);
```

---

## 🧪 Testing

### Test Cards (Stripe Test Mode)

```javascript
// Erfolgreiche Zahlung
4242 4242 4242 4242

// Declined Card
4000 0000 0000 0002

// Requires Authentication (3D Secure)
4000 0025 0000 3155

// Insufficient Funds
4000 0000 0000 9995
```

### Test Scenarios

1. **Happy Path**
   - Match Request mit €50
   - Accept → Payment Intent created
   - Appointment Complete → Payment captured

2. **Refund Path**
   - Match Request mit €50
   - Accept → Payment Intent created
   - Appointment Cancelled → Refund issued

3. **Dispute Path**
   - Payment captured
   - User öffnet Dispute
   - Admin Review → Refund/Keep Decision

---

## 📅 Implementierungs-Zeitplan

| Phase | Dauer | Tasks |
|-------|-------|-------|
| **Setup** | 0.5 Tag | Stripe Account, API Keys, Dependencies |
| **Backend** | 2 Tage | PaymentService, Consumers, Webhooks |
| **Frontend** | 1 Tag | Payment UI, Stripe Elements |
| **Testing** | 0.5 Tag | Test Cards, Flow Testing |

**GESAMT: 4 Arbeitstage**

---

## 🚀 Go-Live Checklist

- [ ] Stripe Account verifiziert (Business Info, Bank Account)
- [ ] Live API Keys in Production Environment
- [ ] Webhook Endpoints registriert in Stripe Dashboard
- [ ] SSL Zertifikat für Webhooks aktiv
- [ ] Payment Flow End-to-End getestet
- [ ] Refund Flow getestet
- [ ] Dispute Handling Prozess dokumentiert
- [ ] Terms of Service aktualisiert (Payment Policy)
- [ ] GDPR Compliance für Payment Data geprüft

---

## 📚 Ressourcen

- [Stripe API Docs](https://stripe.com/docs/api)
- [Stripe.NET Library](https://github.com/stripe/stripe-dotnet)
- [Stripe React Components](https://stripe.com/docs/stripe-js/react)
- [Payment Intents Guide](https://stripe.com/docs/payments/payment-intents)
- [Escrow with Stripe](https://stripe.com/docs/payments/place-a-hold-on-a-payment-method)

---

**Status**: 📝 Dokumentiert, bereit für Implementierung nach Core Features

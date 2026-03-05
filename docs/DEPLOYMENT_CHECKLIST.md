# Production Deployment Checklist

## Pre-Deployment (1 week before)

### Planning
- [ ] Notify team of deployment date/time
- [ ] Schedule maintenance window (if needed)
- [ ] Prepare rollback plan
- [ ] Review all pending changes
- [ ] Create backup of production database

### Testing
- [ ] Run full test suite locally
- [ ] Run E2E tests against staging
- [ ] Test all payment flows
- [ ] Test email notifications
- [ ] Test error handling
- [ ] Test rate limiting
- [ ] Performance testing

### Security Review
- [ ] Security audit of code changes
- [ ] Review environment variables
- [ ] Verify no secrets in code
- [ ] Check SSL/TLS configuration
- [ ] Review CORS settings
- [ ] Audit database permissions

### Documentation
- [ ] Update deployment guide
- [ ] Document configuration changes
- [ ] Create runbook for incidents
- [ ] Update team documentation

## 1 Day Before Deployment

### Final Checks
- [ ] Verify all environment variables are set
- [ ] Test database connection string
- [ ] Verify Stripe keys are live (not test)
- [ ] Verify all API keys are valid
- [ ] Check domain DNS records
- [ ] Verify SSL certificate

### Backups
- [ ] Backup production database
- [ ] Backup environment variables
- [ ] Tag current production version in git
- [ ] Document current deployment state

### Communication
- [ ] Notify stakeholders
- [ ] Prepare status page message
- [ ] Setup monitoring alerts
- [ ] Brief support team

## Deployment Day

### Pre-Deployment (2 hours before)
- [ ] Final code review
- [ ] Verify all tests pass
- [ ] Check CI/CD pipeline
- [ ] Verify build artifacts
- [ ] Test in staging environment
- [ ] Confirm team availability

### Deployment (Start)
- [ ] Post status update
- [ ] Start deployment
- [ ] Monitor build process
- [ ] Monitor deployment progress
- [ ] Check error logs
- [ ] Monitor application performance

### Post-Deployment (Immediately after)
- [ ] Verify application loads
- [ ] Check for console errors
- [ ] Test critical user flows
- [ ] Verify database connection
- [ ] Check API responses
- [ ] Monitor error rates (Sentry)

### Verification (30 minutes after)
- [ ] [ ] **Application Health**
  - [ ] Homepage loads
  - [ ] No console errors
  - [ ] API responds with 200
  - [ ] Database queries work
  
- [ ] **Authentication**
  - [ ] Signup works
  - [ ] Login works
  - [ ] Email verification works
  - [ ] Session persistence works
  
- [ ] **Core Features**
  - [ ] Create request works
  - [ ] Accept request works
  - [ ] Complete request works
  - [ ] Dashboard loads
  
- [ ] **Payments**
  - [ ] Stripe integration works
  - [ ] Payment form loads
  - [ ] Test payment succeeds
  - [ ] Webhook received
  
- [ ] **Notifications**
  - [ ] Emails send
  - [ ] In-app notifications work
  - [ ] Admin notifications work
  
- [ ] **Analytics**
  - [ ] PostHog events tracked
  - [ ] Sentry errors logged
  - [ ] Performance metrics collected
  
- [ ] **Rate Limiting**
  - [ ] Rate limits enforced
  - [ ] Redis connection works
  - [ ] Blocked users can't access

### Monitoring (First 2 hours)
- [ ] Monitor error rates
- [ ] Monitor response times
- [ ] Monitor database performance
- [ ] Monitor API usage
- [ ] Check user feedback
- [ ] Monitor payment processing

### Monitoring (First 24 hours)
- [ ] Monitor all metrics
- [ ] Check for any issues
- [ ] Review error logs
- [ ] Verify backups completed
- [ ] Check user activity
- [ ] Monitor infrastructure

## Post-Deployment

### Day 1
- [ ] Verify all features working
- [ ] Check error rates normal
- [ ] Review performance metrics
- [ ] Confirm user feedback positive
- [ ] Monitor payment processing
- [ ] Check email delivery

### Day 2-3
- [ ] Continue monitoring
- [ ] Review analytics
- [ ] Check for any issues
- [ ] Optimize performance if needed
- [ ] Update documentation

### Week 1
- [ ] Full system verification
- [ ] Performance optimization
- [ ] Security audit
- [ ] Backup verification
- [ ] Team retrospective

## Rollback Procedures

### If Critical Issues Found

1. **Immediate Actions:**
   - [ ] Post incident notice
   - [ ] Notify team
   - [ ] Gather information
   - [ ] Assess severity

2. **Rollback Decision:**
   - [ ] Determine if rollback needed
   - [ ] Get approval from lead
   - [ ] Prepare rollback plan

3. **Execute Rollback:**
   - [ ] Promote previous deployment (Vercel)
   - [ ] Verify rollback successful
   - [ ] Test critical flows
   - [ ] Monitor for issues

4. **Post-Rollback:**
   - [ ] Notify stakeholders
   - [ ] Document what went wrong
   - [ ] Plan fix
   - [ ] Schedule re-deployment

## Integration Verification

### Stripe
- [ ] Webhook endpoint receiving events
- [ ] Payments processing correctly
- [ ] Refunds working
- [ ] Webhook logs show activity
- [ ] No failed transactions

### Resend Email
- [ ] Signup emails sending
- [ ] Notification emails sending
- [ ] Domain verified
- [ ] No bounces
- [ ] Delivery rate > 95%

### PostHog Analytics
- [ ] Events being tracked
- [ ] User properties set
- [ ] Dashboard showing data
- [ ] No data loss

### Sentry Error Tracking
- [ ] Errors being captured
- [ ] Stack traces available
- [ ] Alerts configured
- [ ] Team notifications working

### Upstash Redis
- [ ] Rate limiting working
- [ ] Connection stable
- [ ] No timeouts
- [ ] Performance acceptable

## Performance Verification

- [ ] Page load time < 3s
- [ ] API response time < 500ms
- [ ] Database queries < 100ms
- [ ] No memory leaks
- [ ] CPU usage normal
- [ ] Disk usage normal

## Security Verification

- [ ] HTTPS enforced
- [ ] Security headers present
- [ ] CORS configured correctly
- [ ] Rate limiting active
- [ ] No exposed secrets
- [ ] RLS policies enforced
- [ ] Access logs available

## Monitoring Setup

- [ ] Sentry alerts configured
- [ ] Vercel alerts configured
- [ ] Supabase alerts configured
- [ ] Slack notifications working
- [ ] Email alerts working
- [ ] On-call rotation assigned

## Documentation Updates

- [ ] Update deployment guide
- [ ] Update runbook
- [ ] Update team wiki
- [ ] Update status page
- [ ] Update changelog
- [ ] Update version number

## Team Communication

- [ ] Deployment successful announcement
- [ ] Feature highlights shared
- [ ] Known issues documented
- [ ] Support team briefed
- [ ] Customer communication sent
- [ ] Social media updated

## Sign-Off

- [ ] Development lead: _______________  Date: _______
- [ ] QA lead: _______________  Date: _______
- [ ] DevOps lead: _______________  Date: _______
- [ ] Product manager: _______________  Date: _______

## Notes

```
[Space for deployment notes, issues encountered, and resolutions]
```

## Post-Deployment Review (1 week after)

- [ ] Review deployment metrics
- [ ] Gather team feedback
- [ ] Document lessons learned
- [ ] Plan improvements
- [ ] Update processes
- [ ] Schedule next deployment

## Emergency Contact

- **On-Call Lead:** _______________
- **Phone:** _______________
- **Slack:** _______________
- **Escalation:** _______________

---

**Version:** 1.0  
**Last Updated:** [Date]  
**Next Review:** [Date]

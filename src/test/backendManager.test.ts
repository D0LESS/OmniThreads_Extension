import { expect } from 'chai';
import * as backendManager from '../backendManager';

describe('backendManager', () => {
    it('searchConversations returns an array (mocked fetch)', async () => {
        const originalFetch = (global as any).fetch;
        (global as any).fetch = async () => ({ ok: true, json: async () => [{ id: 1 }] });
        const results = await backendManager.searchConversations('test', 'query');
        expect(results).to.be.an('array');
        (global as any).fetch = originalFetch;
    });

    it('searchConversations handles fetch errors gracefully', async () => {
        const originalFetch = (global as any).fetch;
        (global as any).fetch = async () => { throw new Error('fail'); };
        const results = await backendManager.searchConversations('test', 'query');
        expect(results).to.be.an('array').that.is.empty;
        (global as any).fetch = originalFetch;
    });
}); 
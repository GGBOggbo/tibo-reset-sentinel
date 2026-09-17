import { describe, it, expect, vi, afterEach } from "vitest";
import { sendResetAlert, sendOpsAlert, postLark } from "@/lib/notify";

afterEach(() => vi.unstubAllGlobals());

const ok = () => Promise.resolve({ ok: true, json: () => Promise.resolve({ code: 0 }) } as Response);

describe("postLark", () => {
  it("POST msg_type=text 到 webhook，业务 code≠0 重试后仍抛错", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValue({ ok: true, json: () => Promise.resolve({ code: 19001 }) } as Response);
    vi.stubGlobal("fetch", fetchMock);
    await expect(postLark("https://open.feishu.cn/hook/x", "hi", 1)).rejects.toThrow();
    expect(fetchMock).toHaveBeenCalledTimes(1); // retries=1 不重试
    vi.unstubAllGlobals();
    const okMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ code: 19001 }) } as Response)
      .mockResolvedValue({ ok: true, json: () => Promise.resolve({ code: 0 }) } as Response);
    vi.stubGlobal("fetch", okMock);
    await expect(postLark("https://open.feishu.cn/hook/x", "hi", 3)).resolves.toBeUndefined();
    expect(okMock).toHaveBeenCalledTimes(2); // 第一次失败，第二次重试成功
  });
});

describe("sendResetAlert", () => {
  it("未配置 webhook 时跳过不抛错", async () => {
    delete process.env.LARK_SUBSCRIBE_WEBHOOK;
    await expect(sendResetAlert({ seq: 54, type: "reset",
      announcedAt: "2026-09-20T00:00:00Z", tweetUrl: "https://x.com/thsottiaux/status/101" }))
      .resolves.toBeUndefined();
  });
  it("调用订阅群 webhook 且 @所有人", async () => {
    process.env.LARK_SUBSCRIBE_WEBHOOK = "https://open.feishu.cn/hook/sub";
    const fetchMock = vi.fn().mockImplementation(ok);
    vi.stubGlobal("fetch", fetchMock);
    await sendResetAlert({ seq: 54, type: "reset",
      announcedAt: "2026-09-20T00:00:00Z", tweetUrl: "https://x.com/thsottiaux/status/101" });
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(fetchMock.mock.calls[0][0]).toBe("https://open.feishu.cn/hook/sub");
    expect(body.msg_type).toBe("text");
    expect(body.content.text).toContain("<at user_id=\"all\">所有人</at>");
    expect(body.content.text).toContain("status/101");
    delete process.env.LARK_SUBSCRIBE_WEBHOOK;
  });
});

describe("sendOpsAlert", () => {
  it("未配置时跳过；配置时发运维群", async () => {
    delete process.env.LARK_OPS_WEBHOOK;
    await expect(sendOpsAlert("test")).resolves.toBeUndefined();
    process.env.LARK_OPS_WEBHOOK = "https://open.feishu.cn/hook/ops";
    const fetchMock = vi.fn().mockImplementation(ok);
    vi.stubGlobal("fetch", fetchMock);
    await sendOpsAlert("告警：信号源不可达");
    expect(fetchMock.mock.calls[0][0]).toBe("https://open.feishu.cn/hook/ops");
    delete process.env.LARK_OPS_WEBHOOK;
  });
});

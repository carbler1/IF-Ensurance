// Every test talks to the fake API instead of a real backend, starting from the recorded demo data.
import { resetFakeApi } from "./fakeApi";

jest.mock("@/lib/api", () => jest.requireActual("../test-support/fakeApi"));

beforeEach(() => resetFakeApi());

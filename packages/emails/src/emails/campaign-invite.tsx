import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Row,
  render,
  Section,
  Tailwind,
  Text,
} from "react-email";

import { APP_NAME, EMAIL_TAGLINE } from "@tablekeep/shared";

import { BarebonesFonts, barebonesBoxedTailwindConfig } from "../styles";
import type { AdditionalLinks } from "../types/additional";

type CampaignInviteProps = {
  appName: string;
  campaignName: string;
  inviterName: string;
  role: "dm" | "player";
  url: string;
  expiresAt: Date | string;
  baseUrl: string;
  additionalLinks?: AdditionalLinks;
};

const roleLabels = {
  dm: "as a DM",
  player: "as a player",
} as const;

function formatExpiry(expiresAt: Date | string) {
  const date = expiresAt instanceof Date ? expiresAt : new Date(expiresAt);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return `${new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(date)} UTC`;
}

export const CampaignInvite = ({
  appName,
  campaignName,
  inviterName,
  role,
  url,
  expiresAt,
  baseUrl,
  additionalLinks,
}: CampaignInviteProps) => {
  const expiry = formatExpiry(expiresAt);

  return (
    <Tailwind config={barebonesBoxedTailwindConfig}>
      <Html>
        <Head>
          <style>
            {`
            :root {
              color-scheme: light dark;
              supported-color-schemes: light dark;
            }

            @media (prefers-color-scheme: dark) {
              .logo-light {
                display: none !important;
              }

              .logo-dark {
                display: block !important;
                max-height: none !important;
                overflow: visible !important;
              }
            }

            [data-ogsc] .logo-light {
              display: none !important;
            }

            [data-ogsc] .logo-dark {
              display: block !important;
              max-height: none !important;
              overflow: visible !important;
            }
          `}
          </style>
          <BarebonesFonts />
        </Head>

        <Body className="m-0 bg-bg-2 text-center font-sans">
          <Preview>
            {inviterName} invited you to {campaignName}
          </Preview>
          <Container className="mx-auto mobile:mt-0 mt-8 w-full max-w-[640px]">
            <Section>
              <Section className="bg-bg mobile:px-2 px-6 py-4">
                <Section className="mb-3 px-6">
                  <Row>
                    <Column className="w-1/2 py-[7px] align-middle">
                      <Row>
                        <Column className="w-[32px] align-middle">
                          <Link href={baseUrl}>
                            <Img
                              src={`${baseUrl}/towerkeep.png`}
                              alt=""
                              width={23}
                              className="block"
                            />
                          </Link>
                        </Column>
                      </Row>
                    </Column>
                    <Column
                      align="right"
                      className="w-1/2 py-[7px] align-middle"
                    >
                      <Link
                        href={baseUrl}
                        className="m-0 text-right font-13 font-sans"
                      >
                        <span className="text-fg-3">{appName}</span>
                      </Link>
                    </Column>
                  </Row>
                </Section>
                <Section className="rounded-[8px] bg-bg-2 mobile:px-6 px-[40px] mobile:py-12 py-[64px] text-center">
                  <Section className="mb-3">
                    <Link href={baseUrl}>
                      <Img
                        src={`${baseUrl}/towerkeep-icon.svg`}
                        alt="Logo"
                        width={48}
                        className="logo-dark mx-auto mb-5 block"
                      />
                      <Img
                        src={`${baseUrl}/towerkeep-icon-light.svg`}
                        alt="Logo"
                        width={48}
                        className="logo-light mx-auto mb-5 block"
                      />
                    </Link>
                    <Heading as="h1" className="m-0 font-28 font-sans text-fg">
                      Join {campaignName}
                    </Heading>
                  </Section>

                  <Text className="mx-auto mt-0 mb-8 max-w-[380px] text-center font-16 font-sans text-fg-2">
                    {inviterName} invited you to this campaign on {appName}{" "}
                    {roleLabels[role]}.
                    <br />
                    Accept the invitation to see the campaign.
                  </Text>

                  <Section className="mb-6 text-center">
                    <Button
                      href={url}
                      className="inline-block rounded-lg bg-fg px-7 py-4 text-center font-16 font-sans text-fg-inverted leading-6"
                    >
                      Review invitation
                    </Button>
                  </Section>

                  <Text className="mx-auto mt-8 mb-0 max-w-[400px] text-center font-13 font-sans text-fg-3">
                    {expiry
                      ? `This invitation expires on ${expiry}.`
                      : "This invitation expires after a short time."}
                    <br />
                    It only works for this email address.
                  </Text>
                </Section>

                {/* Footer */}
                <Section className="bg-bg">
                  <Row>
                    <Column className="px-6 py-10 text-center">
                      <Text className="mx-auto mt-0 mb-8 max-w-[280px] text-center font-13 font-sans text-fg-3">
                        {EMAIL_TAGLINE}
                      </Text>

                      <Text className="mt-4 mb-5 text-center font-11 font-sans text-fg-3">
                        You received this email because someone invited this
                        address to a campaign. If you were not expecting it, you
                        can ignore this message.
                      </Text>
                      <Text className="m-0 text-center font-11 font-sans text-fg-3">
                        <Link
                          href={additionalLinks?.privacyPolicy || baseUrl}
                          className="text-fg-3"
                        >
                          Privacy policy
                        </Link>
                      </Text>
                    </Column>
                  </Row>
                </Section>
              </Section>
            </Section>
          </Container>
        </Body>
      </Html>
    </Tailwind>
  );
};

export const renderCampaignInvite = (props: CampaignInviteProps) =>
  render(<CampaignInvite {...props} />);

CampaignInvite.PreviewProps = {
  appName: APP_NAME,
  campaignName: "The Ember Coast",
  inviterName: "Mara Voss",
  role: "player",
  url: "http://localhost:3000/join/i/inv_123",
  expiresAt: "2026-08-17T18:00:00.000Z",
  baseUrl: "http://localhost:3000",
} satisfies CampaignInviteProps;

export default CampaignInvite;

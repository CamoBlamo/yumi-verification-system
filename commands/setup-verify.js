import {
  SlashCommandBuilder,
  ContainerBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  SeparatorBuilder,
  SeparatorSpacingSize,
  TextDisplayBuilder,
  MessageFlags
} from "discord.js"

export const data = new SlashCommandBuilder()
  .setName("setup-verify")
  .setDescription("Post the Yumi account verification panel in this channel.")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)

export async function execute(interaction) {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("yumi-verify")
      .setLabel("Verify")
      .setStyle(ButtonStyle.Primary)
  )

  const container = new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent('## Yumi Verification')
    )
    .addSeparatorComponents(
      new SeparatorBuilder()
        .setDivider(true)
        .setSpacing(SeparatorSpacingSize.Large)
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent('Click the button below to verify your account and gain access to the server.')
    )
    .addActionRowComponents(row)

  await interaction.channel.send({
    components: [container],
    flags: MessageFlags.IsComponentsV2
  })

  await interaction.reply({ content: "Verification panel posted.", ephemeral: true })
}